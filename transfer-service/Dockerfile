# Build depuis la racine du repo : docker build -f transfer-service/Dockerfile .
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY account-service/pom.xml account-service/
COPY transfer-service/pom.xml transfer-service/
RUN mvn -q -B dependency:go-offline -pl transfer-service -am
COPY transfer-service/src transfer-service/src
RUN mvn -q -B package -pl transfer-service -am -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=build /app/transfer-service/target/transfer-service.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
