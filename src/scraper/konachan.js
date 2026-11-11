const axios = require('axios')
const cheerio = require('cheerio')

/**
 * Search Konachan for anime images
 * @param {string} tags - Tags to search (e.g., "naruto", "hatsune_miku")
 * @returns {Promise<Array|Object>} - Array of posts or error object
 */
async function searchKonachan(tags) {
  const url = `https://konachan.net/post?tags=${encodeURIComponent(tags)}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const posts = [];

    $('#post-list-posts li').each((index, element) => {
      const id = $(element).attr('id')?.replace('p', '') || null;
      const previewUrl = $(element).find('img').attr('src') || null;
      const sourceUrl = $(element).find('.thumb').attr('href') || null;

      const titleAttr = $(element).find('.thumb img').attr('title') || '';
      
      let cleanTags = [];
      if (titleAttr.includes('Tags:')) {
        const rawTags = titleAttr.split('Tags:')[1]?.split('User:')[0]?.trim();
        if (rawTags) {
          cleanTags = rawTags.split(/\s+/);
        }
      } else {
        cleanTags = $(element).find('img').attr('alt')?.trim().split(/\s+/) || [];
      }

      if (id) {
        posts.push({
          id: parseInt(id),
          tags: cleanTags,
          details_page: sourceUrl ? `https://konachan.net${sourceUrl}` : null,
          images: {
            preview: previewUrl ? (previewUrl.startsWith('http') ? previewUrl : `https:${previewUrl}`) : null
          }
        });
      }
    });

    return posts;
  } catch (error) {
    return { error: true, message: error.message };
  }
}

/**
 * Get single post by ID
 * @param {number} id - Post ID
 * @returns {Promise<Object>}
 */
async function getPostById(id) {
  const url = `https://konachan.net/post/show/${id}`;
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    
    // Ambil gambar full size
    const fullImage = $('#image').attr('src') || null;
    const fullImageUrl = fullImage ? (fullImage.startsWith('http') ? fullImage : `https:${fullImage}`) : null;
    
    // Ambil tags
    const tags = [];
    $('.tag-list li a').each((i, el) => {
      tags.push($(el).text().trim());
    });
    
    return {
      id: parseInt(id),
      full_image: fullImageUrl,
      tags: tags,
      source: `https://konachan.net/post/show/${id}`
    };
  } catch (error) {
    return { error: true, message: error.message };
  }
}

/**
 * Get random posts
 * @param {string} tags - Tags to search
 * @param {number} limit - Number of posts (max 20)
 * @returns {Promise<Array>}
 */
async function getRandomPosts(tags = '', limit = 5) {
  const posts = await searchKonachan(tags);
  
  if (posts.error || !posts.length) {
    return [];
  }
  
  // Shuffle dan ambil sesuai limit
  const shuffled = [...posts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, Math.min(limit, 20));
}

module.exports = {
  searchKonachan,
  getPostById,
  getRandomPosts
}