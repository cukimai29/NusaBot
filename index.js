const { antivirtexListener } = require('./plugins/group/antivirtex');
const { runAutoGreetVideo } = require('./plugins/owner/autogreetvid');
const { runAutoGreet } = require('./plugins/owner/autogreet');
const { runAutoGreet2 } = require('./plugins/owner/autogreet2');
const { setupAntiPMListener } = require('./plugins/owner/antipm.js');
const { setupSiderListener } = require('./plugins/group/sider.js');
const { setupTriggerListener } = require('./plugins/fun/zeroTwoTrigger.js');

const originalConsoleLog = console.log;
console.log = (...args) => {
  const msg = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
    .join(" ");
  
  const ignoredPatterns = [
    "Closing", "session", "SessionEntry",
    "prekey", "_chains", "registrationId",
    "Buffer", "chainKey", "ephemeralKeyPair",
    "rootKey", "indexInfo", "pendingPreKey",
    "currentRatchet", "baseKey", "privKey"
  ];
  
  if (ignoredPatterns.some(pattern => msg.includes(pattern))) {
    return;
  }
  
  originalConsoleLog.apply(console, args);
};

const path = require("path");
const fs = require("fs");
const config = require("./config");
const { startConnection } = require("./src/connection");
const {
  messageHandler,
  groupHandler,
  messageUpdateHandler,
  groupSettingsHandler,
} = require("./src/handler");
const { loadPlugins, pluginStore } = require("./src/lib/plugins");
const { initDatabase, getDatabase } = require("./src/lib/database");
const {
  initScheduler,
  loadScheduledMessages,
  startGroupScheduleChecker,
  startSewaChecker,
} = require("./src/lib/scheduler");
const { startAutoBackup } = require("./src/lib/backup");
const { handleAntiTagSW } = require("./src/lib/groupProtection");
const { initSholatScheduler } = require("./src/lib/sholatScheduler");
const { initAutoJpmScheduler } = require("./src/lib/autojpmScheduler");

try {
  const { startOrderPoller } = require("./src/lib/orderPoller");
} catch {}

const {
  logger,
  c,
  printBanner,
  printStartup,
  logConnection,
  logErrorBox,
  divider,
} = require("./src/lib/colors");

// ========== GLOBAL VARIABLES ==========
const startTime = Date.now();
let pluginWatcher = null;
let srcWatcher = null;
const reloadDebounce = new Map();

// ========== DEV WATCHER FUNCTIONS ==========
function startDevWatcher(pluginsPath) {
  if (pluginWatcher) {
    pluginWatcher.close();
  }

  logger.system("Dev Mode", "Plugin hot reload enabled");

  pluginWatcher = fs.watch(
    pluginsPath,
    { recursive: true },
    (eventType, filename) => {
      if (!filename || !filename.endsWith(".js")) return;

      const existingTimeout = reloadDebounce.get(filename);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeout = setTimeout(() => {
        reloadDebounce.delete(filename);
        const fullPath = path.join(pluginsPath, filename);

        if (!fs.existsSync(fullPath)) {
          const pluginName = path.basename(filename, ".js");
          const { unloadPlugin } = require("./src/lib/plugins");
          const result = unloadPlugin(pluginName);
          if (result.success) {
            logger.warn("Plugin removed", filename);
          }
          return;
        }

        try {
          const { hotReloadPlugin } = require("./src/lib/plugins");
          const result = hotReloadPlugin(fullPath);
          if (!result.success) {
            logger.error("Reload failed", `${filename}: ${result.error}`);
          }
        } catch (error) {
          logger.error("Reload failed", `${filename}: ${error.message}`);
        }
      }, 500);

      reloadDebounce.set(filename, timeout);
    }
  );

  logger.debug("Watching", pluginsPath);
}

function startSrcWatcher(srcPath) {
  if (srcWatcher) {
    srcWatcher.close();
  }

  logger.system("Dev Mode", "Src hot reload enabled");

  srcWatcher = fs.watch(srcPath, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith(".js")) return;

    const existingTimeout = reloadDebounce.get("src_" + filename);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(() => {
      reloadDebounce.delete("src_" + filename);
      const fullPath = path.join(srcPath, filename);

      if (!fs.existsSync(fullPath)) {
        logger.warn("Src file removed", filename);
        return;
      }

      try {
        delete require.cache[require.resolve(fullPath)];
        logger.success("Src reloaded", filename);
      } catch (error) {
        logger.error("Src reload failed", `${filename}: ${error.message}`);
      }
    }, 500);

    reloadDebounce.set("src_" + filename, timeout);
  });

  logger.debug("Watching", srcPath);
}

// ========== ANTI CRASH ==========
function setupAntiCrash() {
  process.on("uncaughtException", (error, origin) => {
    const ignoredErrors = [
      'write EOF', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT',
      'ENOTFOUND', 'ECONNREFUSED', 'read ECONNRESET'
    ];
    
    const isIgnored = ignoredErrors.some(msg => 
      error.message?.includes(msg) || error.code === msg
    );
    
    if (isIgnored) return;
    
    logErrorBox("Uncaught Exception", error.message);
    if (config.dev?.debugLog) {
      console.error(c.gray(error.stack));
    }
    logger.info("SYSTEM", "Bot tetap berjalan...");
  });

  process.on("unhandledRejection", (reason, promise) => {
    logErrorBox("Unhandled Rejection", String(reason));
    if (config.dev?.debugLog) {
      console.error(c.gray("Promise:"), promise);
    }
    logger.info("SYSTEM", "Bot tetap berjalan...");
  });

  process.on("warning", (warning) => {
    logger.warn("SYSTEM", `${warning.name}: ${warning.message}`);
  });

  process.on("SIGINT", () => {
    console.log("");
    logger.system("SYSTEM", "SIGINT diterima");
    logger.info("DATABASE", "Menyimpan data...");

    try {
      const { getDatabase } = require("./src/lib/database");
      const db = getDatabase();
      db.save();
      logger.success("DATABASE", "Data tersimpan");
    } catch (error) {
      logger.warn("DATABASE", `Gagal menyimpan: ${error.message}`);
    }

    logger.info("SYSTEM", "Bot dihentikan");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("");
    logger.system("SYSTEM", "SIGTERM diterima");
    process.exit(0);
  });

  logger.success("SYSTEM", "Anti-crash aktif");
}

// ========== MAIN FUNCTION ==========
async function main() {
  printBanner();
  printStartup({
    name: config.bot?.name || "NusaBot",
    version: config.bot?.version || "1.0.0",
    developer: config.bot?.developer || "RzkyADS",
    mode: config.mode || "public",
  });
  
  setupAntiCrash();
  divider();

  // ========== DATABASE INIT ==========
  logger.info("DATABASE", "Memuat database...");
  const dbPath = path.join(process.cwd(), config.database?.path || "./database/main");
  await initDatabase(dbPath);
  logger.success("DATABASE", "Database siap");

  const db = getDatabase();
  
  // Load saved settings
  const savedMode = db.setting("botMode");
  if (savedMode && (savedMode === "self" || savedMode === "public")) {
    config.mode = savedMode;
    logger.info("MODE", `Mode bot: ${savedMode}`);
  }
  
  const savedPremium = db.setting("premiumUsers");
  if (Array.isArray(savedPremium)) {
    config.premiumUsers = savedPremium;
    logger.info("PREMIUM", `${savedPremium.length} user premium dimuat`);
  }
  
  const savedBanned = db.setting("bannedUsers");
  if (Array.isArray(savedBanned)) {
    config.bannedUsers = savedBanned;
    logger.info("BANNED", `${savedBanned.length} user banned dimuat`);
  }
  
  if (config.backup?.enabled !== false) {
    startAutoBackup(dbPath);
  }

  // ========== PLUGINS LOAD ==========
  const pluginsPath = path.join(process.cwd(), "plugins");
  const pluginCount = loadPlugins(pluginsPath);
  logger.success("PLUGINS", `${pluginCount} plugin dimuat`);
  logger.success("CASE", "Case handler aktif");
  
  if (config.dev?.enabled && config.dev?.watchPlugins) {
    startDevWatcher(pluginsPath);
  }
  if (config.dev?.enabled && config.dev?.watchSrc) {
    const srcPath = path.join(process.cwd(), "src");
    startSrcWatcher(srcPath);
  }

  // ========== SCHEDULER INIT ==========
  initScheduler(config);
  logger.success("SCHEDULE", "Scheduler siap");

  const bootTime = Date.now() - startTime;
  logger.success("BOOT", `Selesai dalam ${bootTime}ms`);
  divider();
  logger.info("WA", "Menghubungkan ke WhatsApp...");
  console.log("");

  // ========== START CONNECTION ==========
  await startConnection({
    onRawMessage: async (msg, sock) => {
      try {
        const db = getDatabase();
        await handleAntiTagSW(msg, sock, db);
      } catch (error) {}
    },

    onMessage: async (msg, sock) => {
      try {
        const handlerPromise = messageHandler(msg, sock);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Handler timeout")), 60000)
        );
        await Promise.race([handlerPromise, timeoutPromise]);
      } catch (error) {
        if (error.message !== "Handler timeout") {
          logger.error("HANDLER", error.message);
          if (config.dev?.debugLog) {
            console.error(c.gray(error.stack));
          }
        }
      }
    },

    onGroupUpdate: async (update, sock) => {
      try {
        await groupHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onMessageUpdate: async (updates, sock) => {
      try {
        await messageUpdateHandler(updates, sock);
      } catch (error) {
        logger.error("MSG", error.message);
      }
    },

    onGroupSettingsUpdate: async (update, sock) => {
      try {
        await groupSettingsHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onConnectionUpdate: async (update, sock) => {
      if (update.connection === "open") {
        logConnection("connected", sock.user?.name || "Bot");
        logger.success("READY", "Bot siap menerima pesan!");
        
        // ========== SCHEDULERS ==========
        loadScheduledMessages(sock);
        startGroupScheduleChecker(sock);
        startSewaChecker(sock);
        initScheduler(config, sock);
        initAutoJpmScheduler(sock);
        initSholatScheduler(sock);
        
        // ========== AUTOSAHUR ==========
        try {
          const { initSahurCron } = require('./plugins/religi/autosahur');
          initSahurCron(sock);
          logger.success("AUTOSAHUR", "Cron job initialized (03:00 WIB)");
        } catch (e) {
          logger.error('AutoSahur', `Failed: ${e.message}`);
        }
        
        // ========== ORDER POLLER ==========
        try {
          if (startOrderPoller) startOrderPoller(sock);
        } catch {}
        
        // ========== JADIBOT RESTORE ==========
        try {
          const { getAllJadibotSessions, restartJadibotSession } = require('./src/lib/jadibotManager');
          const sessions = getAllJadibotSessions();
          if (sessions.length > 0) {
            logger.info('JADIBOT', `Memulihkan ${sessions.length} sesi...`);
            for (const session of sessions) {
              await restartJadibotSession(sock, session.id);
            }
          }
        } catch (e) {
          logger.error('JADIBOT', `Gagal memulihkan: ${e.message}`);
        }
        
        // ========== DEV MODE ==========
        if (config.dev?.enabled) {
          logger.info("DEV", "Mode development aktif");
        }
        
        // ========== AUTO PROMO (30 detik) ==========
        setTimeout(() => {
          setInterval(async () => {
            try {
              const { runAutoPromo } = require('./plugins/owner/autopromo');
              await runAutoPromo(sock);
            } catch (e) {
              console.log('[AUTO PROMO ERROR]', e.message);
            }
          }, 30000);
        }, 10000);
        
        // ========== AUTO GREET (15 detik) ==========
        setTimeout(() => {
          setInterval(async () => {
            try {
              const { runAutoGreet } = require('./plugins/owner/autogreet');
              await runAutoGreet(sock);
            } catch (e) {
              console.log('[AUTO GREET ERROR]', e.message);
            }
          }, 15000);
        }, 10000);
          
          // Auto Greet2 Scheduler (cek tiap menit)
setInterval(async () => {
    try {
        await runAutoGreet(sock);   // pagi & malam
        await runAutoGreet2(sock);  // siang & sore
    } catch (err) {
        console.log('[AutoGreet] Error:', err.message);
    }
}, 60000); // 60000 ms = 1 menit
 
 // ========== AUTO GREET VIDEO (Pagi/Malam) ==========
setTimeout(() => {
    setInterval(async () => {
        try {
            const { runAutoGreetVideo } = require('./plugins/owner/autogreetvid');
            await runAutoGreetVideo(sock);
        } catch (e) {
            console.log('[AUTO GREET VIDEO ERROR]', e.message);
        }
    }, 15000);
}, 10000);         
        // ========== ZERO TWO TRIGGER (Gaul Version) ==========
        try {
          await setupTriggerListener(sock);
          console.log('\n🦋 Zero Two Trigger Listener (Gaul Version)...');
          console.log('- Zero Two Trigger Listener READY!');
          console.log('  - Casual replies: 15+ kata gaul');
          console.log('  - Zero Two replies: 14+ panggilan manis');
          console.log('  - Reply mode: ON (membalas pesan)\n');
        } catch (err) {
          console.error('Zero Two Trigger gagal:', err.message);
        }
        
        // ========== SIDER (Silent Reader) LISTENER ==========
        try {
          await setupSiderListener(sock);
          console.log('🕵️ Starting Sider (Silent Reader) Listener...');
          console.log('- Sider (Silent Reader) Listener READY!');
          console.log('  auto detect sider siap darling ~\n');
        } catch (err) {
          console.error('Sider detector gagal:', err.message);
        }
        
        // ========== ANTI-PM LISTENER (Blokir Asli) ==========
        try {
          await setupAntiPMListener(sock);
          console.log('🛡️ Starting Anti-PM Listener (BLOKIR ASLI)...');
          console.log('- Anti-PM Listener READY!');
           console.log(`    - Allowed owners: ${(config.owner?.number || []).join(', ')}`);
          console.log('    - Block mode: BLOKIR ASLI WHATSAPP!\n');
        } catch (err) {
          console.error('Anti-PM gagal:', err.message);
        }
        
    

// ========== ANTI VIRTEX LISTENER ==========
try {
    await antivirtexListener(sock);
    console.log('🛡️ Starting AntiVirtex Listener...');
    console.log('- AntiVirtex Listener READY!');
    console.log('  auto detect virtex siap darling ~\n');
} catch (err) {
    console.error('AntiVirtex gagal:', err.message);
}

if (m.isGroup && !config.isOwner(m.sender)) {
    const antibugResult = await antibug.antibugMiddleware(m, sock)
    if (antibugResult.handled) return
}
       
   // ========== END ANTI VIRTEX LISTENER ==========  
      
               
          
          divider();
        console.log("");
      }
    },
  });
}

// ========== START BOT ==========
main().catch((error) => {
  logErrorBox("Fatal Error", error.message);
  console.error(c.gray(error.stack));
  process.exit(1);
});
