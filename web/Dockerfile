# 基础阶段: 使用Node.js作为基础镜像
FROM node:18-alpine AS base
# 设置工作目录
WORKDIR /app
# 添加全局依赖
RUN apk add --no-cache libc6-compat

# 依赖阶段: 安装所有项目依赖
FROM base AS deps
# 复制package.json和package-lock.json
COPY package.json package-lock.json* ./
# 安装依赖
RUN npm ci

# 构建阶段: 构建应用
FROM base AS builder
WORKDIR /app
# 从依赖阶段复制node_modules
COPY --from=deps /app/node_modules ./node_modules
# 复制源代码
COPY . .
# 设置环境变量
ARG NEXT_PUBLIC_CCY_TOKEN_ADDRESS
ARG NEXT_PUBLIC_RPC_URL
ENV NEXT_PUBLIC_CCY_TOKEN_ADDRESS=$NEXT_PUBLIC_CCY_TOKEN_ADDRESS
ENV NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL
# 构建应用 - 使用输出为standalone模式
RUN npm run build
# 为standalone模式添加额外配置
RUN cd .next/standalone && node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.type='module';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2),'utf8')"

# Nginx阶段: 创建最终镜像使用nginx提供服务
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# 复制Nginx配置
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制静态文件和输出
COPY --from=builder /app/public /usr/share/nginx/html/public
COPY --from=builder /app/.next/static /usr/share/nginx/html/_next/static
COPY --from=builder /app/.next/standalone/. /app

# 设置为生产环境
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 创建启动脚本
RUN echo '#!/bin/sh\n\
cd /app\n\
node server.js &\n\
nginx -g "daemon off;"\n'\
> /start.sh && chmod +x /start.sh

# 暴露端口
EXPOSE 80

# 设置启动命令
CMD ["/start.sh"] 