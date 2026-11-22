export async function copyMarkdown(source: string): Promise<boolean> {
  // 只走现代 Clipboard API；不支持的环境直接返回失败，
  // 不再回退到 document.execCommand('copy')（已废弃，且会引入注入类误报面）。
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(source);
      return true;
    }
  } catch {
    // Permission policies and mobile WebViews can reject even a direct user gesture.
  }
  return false;
}
