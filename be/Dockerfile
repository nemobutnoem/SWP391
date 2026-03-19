FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
RUN printf '#!/bin/sh\nexec java -Dspring.datasource.url="$SPRING_DATASOURCE_URL" -Dspring.datasource.username="$SPRING_DATASOURCE_USERNAME" -Dspring.datasource.password="$SPRING_DATASOURCE_PASSWORD" -jar /app/app.jar\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
