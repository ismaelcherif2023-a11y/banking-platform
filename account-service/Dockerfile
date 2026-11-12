# Build depuis la racine du repo : docker build -f account-service/Dockerfile .
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY account-service/pom.xml account-service/
COPY transfer-service/pom.xml transfer-service/
RUN mvn -q -B dependency:go-offline -pl account-service -am
COPY account-service/src account-service/src
RUN mvn -q -B package -pl account-service -am -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=build /app/account-service/target/account-service.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
