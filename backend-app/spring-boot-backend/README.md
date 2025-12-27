# Event Photo Backend (Spring Boot)

This is the backend service for the Event Photo Face Recognition Platform, built with Spring Boot.

## Prerequisites

- Java 17 or higher
- Maven 3.8.0 or higher
- MySQL 8.0 or PostgreSQL 12+
- AWS S3 bucket (or LocalStack for development)

## Project Structure

```
spring-boot-backend/
├── src/main/java/com/eventphoto/
│   ├── controller/          # REST API controllers
│   ├── service/             # Business logic
│   ├── entity/              # JPA entities
│   ├── repository/          # Data access layer
│   ├── dto/                 # Data transfer objects
│   ├── security/            # JWT and security configuration
│   ├── config/              # Spring configuration classes
│   └── EventPhotoApplication.java
├── src/main/resources/
│   └── application.yml      # Application configuration
├── pom.xml                  # Maven dependencies
└── README.md
```

## Setup Instructions

### 1. Database Setup

Create the database and run the schema:

```bash
mysql -u root -p < db_schema.sql
```

Or for PostgreSQL:

```bash
psql -U postgres < db_schema.sql
```

### 2. Configure Environment Variables

Update `src/main/resources/application.yml` with your database credentials:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/event_photo_db
    username: your_db_user
    password: your_db_password
```

### 3. Configure AWS S3

Update the S3 configuration in `application.yml`:

```yaml
aws:
  s3:
    bucket-name: your-bucket-name
    region: us-east-1
```

For development with LocalStack:

```yaml
aws:
  s3:
    endpoint: http://localhost:4566
    use-path-style-access: true
```

### 4. Configure JWT Secret

Update the JWT secret in `application.yml`:

```yaml
jwt:
  secret: your-super-secret-key-change-this-in-production-at-least-32-characters-long
```

### 5. Build the Project

```bash
mvn clean package
```

### 6. Run the Application

```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080/api`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/health` - Health check

### Admin Operations

- `POST /api/admin/events` - Create a new event
- `GET /api/admin/events` - Get all events for the admin
- `GET /api/admin/events/{eventId}` - Get event details
- `POST /api/admin/photographers` - Create a new photographer

### Photographer Operations

- `POST /api/photographer/events/{eventId}/photos` - Upload a photo
- `GET /api/photographer/events/{eventId}/photos` - Get all photos for an event

### Guest Operations

- `POST /api/guest/events/{eventId}/match-face` - Match guest face with event photos
- `GET /api/guest/events/{eventId}` - Get event information

## Configuration

### application.yml

The main configuration file contains settings for:

- Database connection
- JWT token expiration and secret
- AWS S3 bucket and region
- Face recognition service URL and endpoints
- Logging levels

## Integration with Face Recognition Service

The backend communicates with the Python FastAPI face recognition service via HTTP. Ensure the service is running on `http://localhost:8000` (or update the configuration).

### Endpoints:

- `POST /index-face` - Index faces from uploaded photos
- `POST /match-face` - Match a guest face with indexed faces

## Security

- JWT-based authentication for all protected endpoints
- Role-based access control (SUPER_ADMIN, ADMIN, PHOTOGRAPHER, GUEST)
- Password hashing using BCrypt
- CORS configuration (if needed)

## Testing

Run tests with:

```bash
mvn test
```

## Deployment

### Docker

Build a Docker image:

```bash
docker build -t event-photo-backend .
docker run -p 8080:8080 event-photo-backend
```

### Production Considerations

1. Use environment variables for sensitive data
2. Enable HTTPS
3. Set up proper database backups
4. Configure rate limiting
5. Use a reverse proxy (nginx/Apache)
6. Monitor logs and metrics
7. Set up CI/CD pipeline

## Troubleshooting

### Database Connection Issues

- Ensure MySQL/PostgreSQL is running
- Check database credentials in `application.yml`
- Verify the database exists

### S3 Connection Issues

- Check AWS credentials
- Verify bucket name and region
- For LocalStack, ensure it's running on port 4566

### Face Recognition Service Issues

- Ensure the Python service is running on the configured URL
- Check the service logs for errors
- Verify network connectivity between services

## Contributing

Follow Spring Boot best practices:

- Use meaningful commit messages
- Write unit tests for new features
- Follow the existing code style
- Document complex logic

## License

This project is part of the Event Photo Face Recognition Platform.
