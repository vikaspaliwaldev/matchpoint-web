# MatchPoint Backend API

The **MatchPoint Backend API** is a high-performance RESTful API designed to power the MatchPoint Badminton Tournament Management system. Built with Spring Boot and Java 21, it handles tournament configuration, player registrations, automated match fixture generation, live scoring under BWF rules, audit logging, and secure user management.

---

## 🚀 Features

- **User Authentication & Authorization**: Secure signup, login, and profile management using Spring Security and JWT.
- **Tournament & Event Management**: Full CRUD capabilities for tournaments and individual events (Singles, Doubles, Mixed Doubles).
- **Player Registration & Approvals**: Manage registrations, assign seeds, and track participant status.
- **Automated Fixtures & Schedules**: Dynamic generation of brackets/fixtures based on player seeding.
- **Live Score Tracking**: State management and real-time updates for active matches adhering to standard BWF rules.
- **Leaderboards & Ranks**: Complete tournament standings, ranks, and historical performance tracking.
- **Robust Security**: Role-Based Access Control (RBAC) and JWT validation for protected endpoints.
- **Containerization**: Fully containerized using a secure, multi-stage Docker build.

---

## 🛠️ Technology Stack

- **Core Framework**: [Spring Boot 3.2.5](https://spring.io/projects/spring-boot)
- **Programming Language**: [Java 21 (LTS)](https://adoptium.net/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Persistence Layer**: Spring Data JPA / Hibernate
- **Security**: Spring Security & [JSON Web Tokens (JJWT 0.12.5)](https://github.com/jwtk/jjwt)
- **Productivity**: [Lombok](https://projectlombok.org/)
- **Build Tool**: [Apache Maven](https://maven.apache.org/)

---

## 📂 Project Structure

```
backend/
├── src/
│   └── main/
│       ├── java/io/matchpoint/
│       │   ├── MatchPointApplication.java  # Main application entrypoint
│       │   ├── config/                     # CORS, Security, and JWT Filters
│       │   ├── controller/                 # REST API Controllers (endpoints)
│       │   ├── dto/                        # Request/Response Data Transfer Objects
│       │   ├── entity/                     # JPA Database Entities
│       │   ├── repository/                 # Database Repositories (data access)
│       │   ├── schedule/                   # Scheduled tasks / background jobs
│       │   └── util/                       # Utility and Helper classes
│       └── resources/
│           └── application.yml             # System configuration file
├── Dockerfile                              # Multi-stage Docker deployment config
└── pom.xml                                 # Maven dependencies and build configuration
```

---

## ⚙️ Configuration & Environment Variables

The application is configured using `src/main/resources/application.yml`. You can override the default configurations by defining the following environment variables:

| Environment Variable | Description | Default Value |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC Connection URL | `jdbc:postgresql://pcfwdibqnpvikdntgypw.supabase.co:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `postgres` |
| `JWT_SECRET` | 256-bit Base64 encoded secret key | `dGhpcy1pcy1hLXNl...` (Change in production!) |

---

## 💻 Local Setup & Execution

### Prerequisites
Make sure you have the following installed:
- **Java Development Kit (JDK) 21**
- **Apache Maven 3.8+**
- **PostgreSQL** (Optional if using Supabase or an external database)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd MatchPoint/backend
```

### Step 2: Set Environment Variables
Create the environment variables or update `application.yml` directly. For development:
```bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/matchpoint"
export SPRING_DATASOURCE_USERNAME="your_user"
export SPRING_DATASOURCE_PASSWORD="your_password"
export JWT_SECRET="your-super-secret-key-that-is-at-least-256-bits-long"
```

### Step 3: Run the Application
You can run the application directly using Maven:
```bash
mvn spring-boot:run
```
Once started, the backend API will be available at `http://localhost:8080`.

### Step 4: Build and Package
To compile and build a production-ready JAR:
```bash
mvn clean package -DskipTests
```
The compiled jar file will be located at `target/backend-0.1.0.jar`.

---

## 🐳 Docker Deployment

The application features a secure, multi-stage, and rootless Docker container build.

### Build the Docker Image
From the `backend` directory, run:
```bash
docker build -t matchpoint-backend:latest .
```

### Run the Docker Container
```bash
docker run -d \
  -p 8080:8080 \
  --name matchpoint-api \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://host.docker.internal:5432/matchpoint" \
  -e SPRING_DATASOURCE_USERNAME="postgres" \
  -e SPRING_DATASOURCE_PASSWORD="your_password" \
  -e JWT_SECRET="your-super-secret-key-that-is-at-least-256-bits-long" \
  matchpoint-backend:latest
```

---

## 📝 Logging

Application logs are configured to output to both the console and a file:
- **Log File Location**: `backend/logs/matchpoint-backend.log`
- **Default log levels**:
  - Root: `INFO`
  - MatchPoint components (`io.matchpoint`): `DEBUG`
  - Spring Security / Web: `DEBUG`
