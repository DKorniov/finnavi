import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore: Разрешаем доступ с локального IP (телефон/планшет)
  allowedDevOrigins: ['192.168.1.79'],
};

export default nextConfig;