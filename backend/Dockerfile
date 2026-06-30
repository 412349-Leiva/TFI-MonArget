# Build context must be the repository root (parent pom.xml lives there).
# Example: docker build -f backend/Dockerfile .

FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY backend/pom.xml backend/pom.xml
RUN mvn -f pom.xml -pl backend dependency:go-offline -B

COPY backend/src backend/src
RUN mvn -f pom.xml -pl backend -am package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
WORKDIR /app

COPY --from=build /app/backend/target/backend-*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
