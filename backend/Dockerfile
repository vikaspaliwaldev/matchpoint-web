# ==========================================
# Phase 1: Compile & Package Jar (Maven Build)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy project descriptor and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source directory and package fat jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Phase 2: Lightweight JRE Runner (Alpine)
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root system account for enhanced execution security
RUN addgroup -S matchpoint && adduser -S matchpoint -G matchpoint
USER matchpoint

# Copy packaged jar from build stage
COPY --from=builder /build/target/backend-*.jar ./app.jar

# Expose Java REST API port
EXPOSE 8080

# Configure JVM tuning parameters
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
