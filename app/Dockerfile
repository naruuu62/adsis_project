FROM node:20-alpine

# Best practice: jalankan sebagai non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /usr/src/app

# Copy package files terlebih dahulu (layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code aplikasi
COPY src/ ./src/

# Ubah kepemilikan file ke non-root user
RUN chown -R appuser:appgroup /usr/src/app

# Jalankan container sebagai non-root user
USER appuser

# Expose port aplikasi
EXPOSE 3000

# Health check untuk container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Jalankan aplikasi
CMD ["node", "src/index.js"]
