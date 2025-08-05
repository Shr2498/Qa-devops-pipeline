# QA DevOps Pipeline - Quick Start Guide

## **Your Application is RUNNING!**

**Base URL**: http://localhost:3000

## **API Testing Examples**

### **1. Health Check**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

### **2. Register a New User**
```powershell
$newUser = @{
    username = "demouser"
    email = "demo@example.com"
    password = "Password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -ContentType "application/json" -Body $newUser
```

### **3. Login User**
```powershell
$loginData = @{
    email = "demo@example.com"
    password = "Password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginData
$token = $loginResponse.token
```

### **4. Get Products**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/products"
```

### **5. Create Product (Authenticated)**
```powershell
$headers = @{ Authorization = "Bearer $token" }
$productData = @{
    name = "Test Product"
    description = "Created via API"
    price = 29.99
    category = "Demo"
    stock = 100
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method POST -Headers $headers -ContentType "application/json" -Body $productData
```

## **Development Commands**

### **Run Tests**
```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run lint               # Code quality checks
```

### **Docker Commands** (if Docker is available)
```bash
docker build -t qa-devops-app .
docker run -p 3000:3000 qa-devops-app
docker-compose up          # Full environment
```

## **QA Pipeline Features Demonstrated**

### **Early Defect Detection**
- Linting caught 600+ code style issues
- Automated fixing resolved most issues
- Security scanning (npm audit passed)

### **Comprehensive Testing**
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for user workflows
- Performance tests with k6

### **Continuous Quality**
- Code coverage tracking (currently 74%)
- Quality gates preventing bad code
- Automated validation on every change

### **DevOps Integration**
- Docker containerization ready
- CI/CD pipeline configured
- Multi-environment support

## **Next Steps**

1. **Try the API**: Use the examples above
2. **Run Tests**: Execute `npm test` to see the pipeline
3. **Add Docker**: Install Docker for full environment
4. **Explore Code**: Check the `src/` directory
5. **Review Pipeline**: Look at `.github/workflows/qa-pipeline.yml`

Your QA DevOps Pipeline is successfully demonstrating professional-grade quality assurance practices!
