const chalk = require("chalk");
const gradient = require("gradient-string");
// HAPUS INI: const figlet = require("figlet");
const timeHelper = require("./timeHelper");

// 🔥 GRADIENT MERAH KE BIRU
const bannerGradient = gradient(["#ff0000", "#0000ff"]);

const theme = {
  primary: chalk.hex("#ff3333"),
  secondary: chalk.hex("#0066ff"),
  accent: chalk.hex("#ff6666"),
  text: chalk.hex("#ffffff"),
  dim: chalk.hex("#9999ff"),
  muted: chalk.hex("#ff9999"),
  success: chalk.hex("#ff3333"),
  error: chalk.hex("#ff0000"),
  warning: chalk.hex("#ff6666"),
  info: chalk.hex("#3399ff"),
  debug: chalk.hex("#66ccff"),
  border: chalk.hex("#ff0000"),
  tag: chalk.hex("#0066ff"),
};

const ICON = {
  ok: chalk.hex("#ff3333")("✓"),
  fail: chalk.hex("#ff0000")("✗"),
  dot: chalk.hex("#0066ff")("●"),
  warn: chalk.hex("#ff6666")("!"),
  arrow: chalk.hex("#3399ff")("→"),
  line: "─",
};

function timestamp() {
  return chalk.hex("#3399ff")(`[${timeHelper.formatTime("HH:mm:ss")}]`);
}

function tag(label) {
  return chalk.hex("#0066ff")(label.toUpperCase().padEnd(9));
}

const logger = {
  info: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.dot} ${theme.text(detail)}`);
  },
  success: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.ok} ${theme.text(detail)}`);
  },
  warn: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.warn} ${theme.warning(detail)}`);
  },
  error: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.fail} ${theme.error(detail)}`);
  },
  system: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.arrow} ${theme.dim(detail)}`);
  },
  debug: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)}   ${theme.debug(detail)}`);
  },
  tag: (label, msg, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.dot} ${theme.text(msg)} ${theme.dim(detail)}`);
  },
};

function logMessage(info) {
  if (typeof info === "string") {
    const [chatType, sender, message] = arguments;
    info = {
      chatType,
      sender,
      message,
      pushName: sender,
      groupName: chatType === "group" ? "Unknown" : "Private",
    };
  }

  const { chatType, groupName, pushName, sender, message } = info;
  if (!message || message.trim() === "" || !sender) return;

  const isGroup = chatType === "group";
  const senderNumber = sender.replace("@s.whatsapp.net", "");
  const cleanMsg = message.replace(/\n/g, " ").substring(0, 80) + (message.length > 80 ? "..." : "");
  const time = timeHelper.formatTime("HH:mm:ss");

  const header = isGroup
    ? chalk.hex("#ff3333").bold(groupName)
    : chalk.hex("#0066ff").bold("Private Chat");

  console.log("");
  console.log(theme.border("╭────────────────────────────────────────────╮"));
  console.log(`${theme.border("│")}  ${header}`);
  console.log(`${theme.border("│")}  ${theme.dim("Dari  :")} ${theme.text(pushName)} ${theme.dim(`(${senderNumber})`)}`);
  console.log(`${theme.border("│")}  ${theme.dim("Pesan :")} ${chalk.hex("#ffffff")(cleanMsg)}`);
  console.log(`${theme.border("│")}  ${theme.dim("Waktu :")} ${theme.dim(time)}`);
  console.log(theme.border("╰────────────────────────────────────────────╯"));
}

function logCommand(command, user, chatType) {
  const isGroup = chatType === "group";
  const type = isGroup
    ? chalk.hex("#ff3333").bold("GRUP")
    : chalk.hex("#0066ff").bold("PRIVAT");
  const time = timeHelper.formatTime("HH:mm:ss");
  const cmdBorder = chalk.hex("#ff0000");

  console.log(cmdBorder("╭────────────────────────────────────────────╮"));
  console.log(`${cmdBorder("│")}  ${chalk.hex("#3399ff").bold("⚡ COMMAND")} ${cmdBorder("│")} ${type}`);
  console.log(`${cmdBorder("│")}  ${theme.dim("User  :")} ${chalk.hex("#ffffff")(user)}`);
  console.log(`${cmdBorder("│")}  ${theme.dim("CMD   :")} ${chalk.hex("#ff3333").bold(command)}`);
  console.log(`${cmdBorder("│")}  ${theme.dim("Waktu :")} ${theme.dim(time)}`);
  console.log(cmdBorder("╰────────────────────────────────────────────╯"));
}

function logPlugin(name, category) {
  console.log(`${theme.dim("  ├─")} ${theme.primary(name)} ${theme.dim(`[${category}]`)}`);
}

function logConnection(status, info = "") {
  const w = 44;
  const label =
    status === "connected"
      ? chalk.hex("#ff3333").bold("● TERHUBUNG")
      : status === "connecting"
        ? chalk.hex("#3399ff").bold("◐ MENGHUBUNGKAN")
        : chalk.hex("#ff0000").bold("○ TERPUTUS");

  console.log("");
  console.log(theme.border("═".repeat(w)));
  console.log(`  ${label} ${theme.dim("—")} ${theme.text(info)}`);
  console.log(theme.border("═".repeat(w)));
}

function logErrorBox(title, message) {
  console.log("");
  console.log(chalk.hex("#ff0000").bold("╔═ ERROR ═══════════════════════════════════"));
  console.log(`${chalk.hex("#ff0000")("║")} ${chalk.hex("#ffffff").bold(title)}`);
  console.log(chalk.hex("#ff0000")("╠═══════════════════════════════════════════"));
  console.log(`${chalk.hex("#ff0000")("║")} ${chalk.hex("#ccccff")(message)}`);
  console.log(chalk.hex("#ff0000")("╚═══════════════════════════════════════════"));
}

// ============== BANNER BARU PAKAI ASCII ART KAMU ==============
function printBanner(mini = false) {
  console.clear();
  
  // Banner lengkap
  const banner = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠦⣄⣠⠴⠒⠒⠉⠒⠶⣄⡏⣶⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣠⡞⣡⠀⢠⡀⠀⢦⡀⢹⣷⣼⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡿⠁⣿⠟⣷⣿⢦⡈⣇⠀⢻⣿⣈⢷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⡇⣶⣻⣀⠘⣿⣀⣹⣿⣰⣼⡟⣯⠟⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇⣿⡿⠿⠋⠉⠋⠛⢿⣿⣿⡇⠈⢦⡸⣾⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇⠛⣷⣄⠀⠀⠀⠀⣸⠟⠃⠉⠀⠈⢷⣩⡻⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠹⡄⠈⠙⠒⢤⣴⣾⠉⠁⣀⡀⠀⠀⠀⠹⣟⢮⡳⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⠀⣿⠀⣀⣴⣿⡏⣀⡬⠟⠁⠈⣆⠀⠀⠀⠘⢧⡉⢿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡿⣿⠀⢻⣫⠉⣽⡟⠉⡅⢀⣆⠀⢠⣿⠀⠀⠀⠀⠀⠹⣦⡉⠻⢦⡀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⢗⣿⢀⡷⠁⣸⡿⠁⠀⠀⢸⣿⠃⣄⣈⡆⠀⠀⠀⠀⠀⠈⠫⣱⠦⣌⡓⢤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣇⣾⣿⢟⡇⢀⣿⡇⠀⢀⣰⢸⡌⢿⣿⢻⡟⣃⠀⠀⠀⠰⡂⠠⠌⠲⢤⣙⣻⠛⠓⠶⢦⡤⣄⣀⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣻⣿⠏⣾⠃⢸⢽⡇⠀⡏⠁⡶⠁⠈⣿⣎⡷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠛⠒⠶⢤⣀⠈⠻⣄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣴⣿⠟⠁⡼⠀⣿⠀⡟⢸⡇⢰⠃⢸⠇⠀⠀⢹⣷⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣷⣄⠘⣧⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣤⣾⠟⠋⠀⣠⡼⢁⣼⣿⢠⣧⢾⡇⠘⡀⠸⡇⠀⠀⠘⣿⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡉⠚⢧⠹⣷⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⡴⠖⢋⣽⡿⠥⠖⠚⠉⢁⣴⣾⣿⠃⢈⠀⢸⠇⠀⠁⠀⢳⡀⠀⠀⣿⣿⣽⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠀⠀⠘⢧⡇⠀
⠀⠀⠀⠀⠀⠀⣀⣤⣾⠛⠁⣠⡼⠋⠁⠀⢀⣀⢀⣴⣿⣿⠟⠁⠀⠀⣷⠋⠂⠀⠀⠀⠀⠳⡀⠀⢹⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡿⠀⠀⠀⢸⠧⠀
⠀⠀⢀⡠⠖⠋⣩⠶⢋⡴⠋⠁⠀⠀⠿⣭⡿⣿⠿⠟⢉⣷⣄⠀⢀⣼⣿⡄⠀⠀⠀⠀⠀⢀⣹⠄⠀⢹⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠃⠀⠀⠀⠀⠐⡧
⠀⠀⣸⣄⣴⣛⣡⠞⠋⠀⠀⠀⠀⠀⠀⠀⣭⣤⣴⣾⣿⣿⣿⣷⣿⣿⣿⣷⣤⣴⣶⣾⣿⣿⣿⣆⠀⢈⣿⣷⣤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⢑
⠀⠰⣏⡿⢫⡞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣹⠿⠿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀⠀⢀
⠀⢀⣿⡵⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⣿⣿⣿⣿⣿⣿⣿⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⠛⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⢀⡜⠀⠀⠀⠀⠀⠀⢀⠎
⢠⢸⡟⠹⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡧⠤⢙⠛⠋⠛⠛⠿⠿⢿⡟⠛⠉⠁⠀⠀⠀⠀⠀⠠⠐⠀⠀⠀⠀⠀⠀⠀⢀⡼⢀⠀⠄⠀⠀⡀⡀⠀⠀
⢸⣎⡇⠀⠳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢷⠀⡀⢰⡅⠀⠀⠀⠀⠀⡝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⡿⢋⠞⠀⢠⣮⠎⠀⠀⠀
⠀⢿⣷⠀⠀⠈⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣶⣿⣇⠀⠀⠀⠀⣰⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡾⠋⣠⠋⢀⣴⠟⠁⠀⠀⠀⠀
⠀⠘⣏⢧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⢹⣻⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠟⢡⠞⣁⣴⠟⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠸⡄⠳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⢄⡀⠀⠀⠘⣿⣿⡯⢶⢧⣿⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡾⢁⣴⠿⠚⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠹⡄⠙⢦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠢⣄⠈⢿⣿⡯⣝⣾⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⡯⢖⡿⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠹⡄⠀⠑⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢻⣿⣿⣽⣿⡇⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⢴⣶⠿⠋⠁⣰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠘⢦⡀⠀⠙⠢⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣻⢿⣿⡍⠑⠒⠒⣒⣾⣷⠿⠛⣋⡵⠚⠁⠀⣠⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠙⠢⣄⡀⠀⠙⠓⠒⠀⠀⣀⡀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣷⡚⠛⠉⠁⠀⠀⠐⠋⢀⡀⢀⡤⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠙⠋⠛⠛⣹⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠛⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣻⣿⣿⣿⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⢿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⡏⠸⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠁⠀⢹⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⡏⠀⠀⠈⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⠀⠀⠀⠀⢼⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⠀⠀⠀⠀⣼⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⣿⣿⣿⠀⠀⠀⢀⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⡆⠀⠀⣾⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣷⠀⠀⠸⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣻⡇⠀⠀⠈⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣟⠟⠀⠀⠀`;

  if (mini) {
    console.log(bannerGradient("  NusaBot • WhatsApp Bot Engine"));
    console.log("");
    return;
  }

  console.log("");
  // Print banner dengan gradient
  console.log(bannerGradient(banner));
  console.log(bannerGradient("  ══════════════════════════════════════"));
  console.log(`  ${chalk.hex("#3399ff")("WhatsApp Bot Engine")} ${chalk.hex("#ff3333")("│")} ${chalk.hex("#ff3333")("Powered by RzkyADS")}`);
  console.log(bannerGradient("  ══════════════════════════════════════"));
  console.log("");
}

function printStartup(info = {}) {
  const { name, version, mode } = info;
  const parts = [
    `${theme.dim("Bot:")} ${theme.primary(name)}`,
    `${theme.dim("v")}${theme.secondary(version)}`,
    `${theme.dim("Mode:")} ${theme.text(mode)}`,
    `${theme.dim("Prefix:")} ${theme.text(".")}`,
  ];
  console.log(`  ${parts.join(` ${theme.border("│")} `)}`);
  console.log("");
}

const CODES = {
  reset: "", bold: "", dim: "", italic: "", underline: "",
  green: "", purple: "", white: "", gray: "", phantom: "",
  lime: "", silver: "", red: "", yellow: "", blue: "",
  cyan: "", magenta: "", bgBlack: "", bgGray: "",
};

const c = {
  green: chalk.hex("#ff3333"),
  purple: chalk.hex("#0066ff"),
  white: chalk.hex("#ffffff"),
  gray: chalk.hex("#9999ff"),
  bold: chalk.bold,
  dim: chalk.dim,
  greenBold: (t) => chalk.hex("#ff3333").bold(t),
  purpleBold: (t) => chalk.hex("#0066ff").bold(t),
  whiteBold: (t) => chalk.hex("#ffffff").bold(t),
  grayDim: (t) => chalk.hex("#9999ff").dim(t),
  red: chalk.hex("#ff0000"),
  yellow: chalk.hex("#ff6666"),
  cyan: chalk.hex("#3399ff"),
  blue: chalk.hex("#0066ff"),
  magenta: chalk.hex("#ff3333"),
};

function divider() {
  console.log(theme.border("─".repeat(46)));
}

function createBanner(lines, color = "green") {
  const maxLen = Math.max(...lines.map((l) => l.length));
  const padded = lines.map((l) => l.padEnd(maxLen));
  let res = theme.border(`╭${"─".repeat(maxLen + 2)}╮`) + "\n";
  for (const line of padded) {
    res += theme.border("│") + " " + chalk.hex("#ffffff")(line) + " " + theme.border("│") + "\n";
  }
  res += theme.border(`╰${"─".repeat(maxLen + 2)}╯`);
  return res;
}

function getTimestamp() {
  return theme.dim(timeHelper.formatTime("HH:mm:ss"));
}

module.exports = {
  c,
  CODES,
  logger,
  logMessage,
  logCommand,
  logPlugin,
  logConnection,
  logErrorBox,
  printBanner,
  printStartup,
  createBanner,
  getTimestamp,
  divider,
  theme,
  chalk,
  gradient,
};
