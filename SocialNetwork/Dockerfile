## Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy build descriptors and wrapper first (better cache)
COPY pom.xml mvnw mvnw.cmd ./
COPY .mvn .mvn

# Ensure wrapper is executable for Linux containers
RUN chmod +x mvnw

# Resolve dependencies (offline cache)
RUN ./mvnw dependency:go-offline

# Copy source and build
COPY src src
RUN ./mvnw -DskipTests package

## Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy fat jar from build stage
COPY --from=build /app/target/SocialNetwork-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

