# 🍬 Sweet Distribution Platform - Production Ready

A production-ready B2B sweet ordering platform with React frontend and Spring Boot backend.

## 🚀 Quick Deploy

```bash
git clone <repository-url>
cd sweet-distribution
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d
```

Access at: http://localhost:3000

## 📋 Production Checklist

✅ **Security**
- Environment variables for all secrets
- Strong JWT secret (256-bit)
- Production database credentials
- CORS configured for production domains

✅ **Performance**
- Database connection pooling
- Optimized logging levels
- Build artifacts excluded from repository

✅ **Monitoring**
- Health check endpoint (`/api/health`)
- Structured logging
- Error handling and reporting

✅ **Deployment**
- Docker containers ready
- Docker Compose configuration
- Cloud deployment guides (Railway, Render, AWS)

## 🔧 Environment Setup

### Required Environment Variables

**Backend:**
```env
DATABASE_URL=jdbc:postgresql://localhost:5432/sweet_distribution
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_secure_password
JWT_SECRET=your_256_bit_secret_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

**Frontend:**
```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

## 📚 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [SETUP.md](SETUP.md) - Development setup

## 🔐 Default Admin Account

- Email: `admin@sweetdistribution.com`
- Password: `admin123`

**⚠️ Change this password in production!**

## 🏗️ Tech Stack

- **Backend:** Spring Boot 3.4.1, Java 21, PostgreSQL
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Security:** JWT, Spring Security, BCrypt
- **Payments:** Razorpay Integration
- **Database:** PostgreSQL with Flyway migrations
- **Deployment:** Docker, Docker Compose

## 📞 Support

For deployment issues or questions, please check the documentation or create an issue.