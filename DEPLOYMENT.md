# Production Deployment Guide

## Quick Start with Docker Compose

1. **Clone and setup environment:**
   ```bash
   git clone <repository-url>
   cd sweet-distribution
   cp .env.example .env
   ```

2. **Configure environment variables in `.env`:**
   ```bash
   # Generate a secure JWT secret (256-bit)
   JWT_SECRET=$(openssl rand -base64 32)
   
   # Set secure database password
   DB_PASSWORD=your_secure_password_here
   
   # Add your Razorpay live credentials
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   ```

3. **Deploy:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Admin login: admin@sweetdistribution.com / admin123

## Cloud Deployment Options

### Railway (Recommended)
- Push to GitHub
- Connect Railway to your repo
- Add PostgreSQL addon
- Set environment variables
- Deploy automatically

### Render
- Connect GitHub repo
- Add PostgreSQL database
- Configure environment variables
- Deploy with zero-config

### AWS
- Use Elastic Beanstalk for backend
- S3 + CloudFront for frontend
- RDS for PostgreSQL database

## Security Checklist

- [ ] JWT secret is 256-bit and secure
- [ ] Database password is strong
- [ ] Razorpay keys are live (not test)
- [ ] CORS is configured for production domain
- [ ] Swagger is disabled in production
- [ ] Logging level is INFO or WARN
- [ ] No hardcoded credentials in code

## Environment Variables Reference

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password
- `JWT_SECRET` - 256-bit secret for JWT tokens
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `PORT` - Server port (default: 8080)
- `LOG_LEVEL` - Logging level (INFO/WARN/ERROR)

### Frontend
- `VITE_API_BASE_URL` - Backend API URL