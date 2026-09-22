# Stage 1: Build the application
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app

# Copy the Maven wrapper and pom.xml first to cache dependencies
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
# Fix line endings for Windows users and make wrapper executable
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
RUN ./mvnw dependency:go-offline || true

# Copy source code and build
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]