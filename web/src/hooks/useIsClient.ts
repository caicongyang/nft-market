'use client';

import { useState, useEffect } from 'react';

// 创建一个自定义hook来检测客户端环境
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  
  // 使用useEffect代替useLayoutEffect
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
} 