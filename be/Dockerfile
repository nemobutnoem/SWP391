FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
RUN printf '#!/bin/sh\necho "DB URL=$DATABASE_URL"\nexec java -Dspring.datasource.url="$DATABASE_URL" -Dspring.datasource.username="$DATABASE_USERNAME" -Dspring.datasource.password="$DATABASE_PASSWORD" -jar /app/app.jar\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
