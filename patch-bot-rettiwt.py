"""
Strips Rettiwt from bot.js — replaces all Rettiwt calls with Playwright equivalents.
Run on the server: python3 /tmp/patch-bot-rettiwt.py
"""
import re, shutil, sys

src_path = '/root/qatar-standard-bot/bot.js'
shutil.copy(src_path, src_path + '.bak')

with open(src_path, 'r') as f:
    src = f.read()

original_len = len(src)

# 1. Remove Rettiwt import
src = src.replace("import { Rettiwt } from 'rettiwt-api';\n", '')

# 2. Remove let rettiwt + getRettiwtClient function
src = re.sub(
    r"let rettiwt;\nfunction getRettiwtClient\(\) \{[^}]+\}\n",
    '',
    src
)

# 3. uploadMedia — return null (Playwright handles images directly)
src = re.sub(
    r'async function uploadMedia\(mediaPath\) \{.*?^}',
    '''async function uploadMedia(mediaPath) {
  // Rettiwt removed — Playwright handles images directly
  return null;
}''',
    src, flags=re.DOTALL | re.MULTILINE
)

# 4. postTweet — replace rettiwt try/catch with direct Playwright call
old_post = '''  try {
    const client = getRettiwtClient();
    const tweetPayload = { text: clean };

    if (imagePath) {
      const mediaId = await uploadMedia(imagePath);
      if (mediaId) tweetPayload.media = [{ id: mediaId }];
    }

    await client.tweet.post(tweetPayload);
    console.log('[POST] ✓ Posted!');
    return true;
  } catch (err) {
    console.error('[POST] rettiwt failed:', err.message);
    console.log('[POST] Retrying via Playwright...');
    return await playwrightPostTweet(clean, imagePath);
  }'''
new_post = '''  return await playwrightPostTweet(clean, imagePath);'''
src = src.replace(old_post, new_post)

# 5. postReply — direct Playwright
old_reply = '''  try {
    const client = getRettiwtClient();
    await client.tweet.post({ text: clean, replyTo: tweetId });
    console.log('[REPLY] ✓ Posted!');
    return true;
  } catch (err) {
    console.error('[REPLY] rettiwt failed:', err.message);
    console.log('[REPLY] Retrying via Playwright...');
    const tweetUrl = `https://x.com/${username}/status/${tweetId}`;
    return await playwrightPostReply(tweetUrl, clean);
  }'''
new_reply = '''  const tweetUrl = `https://x.com/${username}/status/${tweetId}`;
  return await playwrightPostReply(tweetUrl, clean);'''
src = src.replace(old_reply, new_reply)

# 6. postQuoteTweet — embed URL so X renders as quote tweet
old_quote = '''  try {
    const client = getRettiwtClient();
    await client.tweet.post({ text: clean, quote: tweetId });
    console.log('[QUOTE] ✓ Posted!');
    return true;
  } catch (err) {
    console.error('[QUOTE] Failed:', err.message);
    return false;
  }'''
new_quote = '''  // Embedding the tweet URL causes X to render it as a quote tweet
  const quoteUrl = `https://x.com/i/status/${tweetId}`;
  return await playwrightPostTweet(`${clean}\\n\\n${quoteUrl}`);'''
src = src.replace(old_quote, new_quote)

# 7. retweetTweet — disable
old_rt = '''  try {
    const client = getRettiwtClient();
    await client.tweet.retweet(tweetId);
    console.log('[RETWEET] ✓ Done!');
    return true;
  } catch (err) {
    console.error('[RETWEET] Failed:', err.message);
    return false;
  }'''
new_rt = '''  // Rettiwt removed — retweet not available via Playwright
  console.log('[RETWEET] Skipped — Rettiwt removed');
  return false;'''
src = src.replace(old_rt, new_rt)

# 8. likeTweet — disable
old_like = '''  try {
    const client = getRettiwtClient();
    await client.tweet.like(tweetId);
    console.log('[LIKE] ✓ Liked!');
    return true;
  } catch (err) {
    console.error('[LIKE] Failed:', err.message);
    return false;
  }'''
new_like = '''  // Rettiwt removed — likes not available via Playwright
  console.log('[LIKE] Skipped — Rettiwt removed');
  return false;'''
src = src.replace(old_like, new_like)

# 9. getAccountId — stub out
old_acc = '''async function getAccountId(username) {
  if (accountIdCache[username]) return accountIdCache[username];
  try {
    const client = getRettiwtClient();
    const user = await client.user.details(username);
    if (user?.id) {
      accountIdCache[username] = user.id;
      console.log(`[ACCOUNTS] Cached @${username} -> ID: ${user.id}`);
    }
    return user?.id || null;
  } catch (err) {
    console.log(`[ACCOUNTS] Failed to get ID for @${username}: ${err.message}`);
    return null;
  }
}'''
new_acc = '''async function getAccountId(username) {
  // Rettiwt removed — account ID lookup unavailable
  return null;
}'''
src = src.replace(old_acc, new_acc)

# 10. fetchAccountTweets — stub out
old_fat = '''async function fetchAccountTweets(username) {
  try {
    const userId = await getAccountId(username);
    if (!userId) return [];
    const client = getRettiwtClient();
    const timeline = await client.user.timeline(userId, 10);
    return timeline?.list || [];
  } catch (err) {
    console.log(`[ACCOUNTS] Error fetching @${username}: ${err.message}`);
    return [];
  }
}'''
new_fat = '''async function fetchAccountTweets(username) {
  // Rettiwt removed — account timeline fetching unavailable
  return [];
}'''
src = src.replace(old_fat, new_fat)

# Write result
with open(src_path, 'w') as f:
    f.write(src)

# Report
remaining = [l for l in src.split('\n')
             if 'rettiwt' in l.lower() and not l.strip().startswith('//') and not l.strip().startswith('*')]
print(f"Original: {original_len} chars")
print(f"New:      {len(src)} chars  ({original_len - len(src)} removed)")
print(f"Remaining rettiwt refs (non-comment): {len(remaining)}")
for l in remaining:
    print(' >', l.strip()[:120])
print("Done — backup at bot.js.bak")
