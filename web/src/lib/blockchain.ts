/**
 * 解析和处理以太坊交易错误
 * @param error 错误对象
 * @returns 用户友好的错误信息
 */
export function parseError(error: any): string {
  console.log("解析错误:", error);
  
  // 如果错误对象为空，返回通用错误信息
  if (!error) return "未知错误，请稍后再试";
  
  // 将错误对象转换为字符串以便于检查
  const errorString = JSON.stringify(error);
  const errorMessage = error.message || error.reason || errorString;
  
  // 检查错误消息中的关键字
  if (typeof errorMessage === 'string') {
    // NFT 所有权相关错误
    if (errorMessage.includes("ERC721: invalid token ID") || 
        errorMessage.includes("nonexistent token")) {
      return "无效的 NFT ID，该 NFT 可能不存在";
    }
    
    if (errorMessage.includes("Not the owner") || 
        errorMessage.includes("caller is not token owner")) {
      return "您不是该 NFT 的所有者";
    }
    
    // 授权相关错误
    if (errorMessage.includes("not approved") || 
        errorMessage.includes("Market not approved")) {
      return "市场合约未获得授权管理此 NFT";
    }
    
    // 用户交互错误
    if (errorMessage.includes("user rejected") || 
        errorMessage.includes("User denied")) {
      return "您取消了交易";
    }
    
    // 网络错误
    if (errorMessage.includes("network") || 
        errorMessage.includes("disconnect")) {
      return "网络连接错误，请检查您的网络连接";
    }
    
    // Gas 相关错误
    if (errorMessage.includes("gas") || 
        errorMessage.includes("Gas limit")) {
      return "Gas 费用不足或超出限制";
    }
    
    // Nonce 错误
    if (errorMessage.includes("nonce")) {
      return "交易 nonce 错误，请刷新页面重试";
    }
    
    // 尝试从错误信息中提取 revert 原因
    const revertMatch = errorMessage.match(/reverted with reason string '([^']+)'/);
    if (revertMatch && revertMatch[1]) {
      return revertMatch[1];
    }
    
    // 处理 JSON-RPC 错误
    if (errorMessage.includes("execution reverted")) {
      return "智能合约执行被回滚";
    }
  }
  
  // 如果我们无法识别特定错误，返回原始消息或通用错误
  return errorMessage || "交易失败，请稍后再试";
} 