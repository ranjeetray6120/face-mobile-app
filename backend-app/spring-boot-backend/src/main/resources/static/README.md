# Event Photo Gallery - Web App (Guest Flow)

This is the guest-facing web application for the Event Photo Face Recognition Platform. It allows guests to scan their face and retrieve their photos from the event.

## Features

- **QR Code Integration**: Guests scan a QR code to access the event
- **Face Capture**: Guests can capture their face using the browser camera
- **Face Matching**: Automatic face recognition to find matching photos
- **Photo Gallery**: Display of matched photos in a responsive grid
- **Photo Download**: Individual or bulk download of photos
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **No Login Required**: Completely anonymous guest experience

## Project Structure

```
web-app/
├── index.html       # Main HTML file
├── app.js           # JavaScript application logic
├── styles.css       # CSS styles
├── package.json     # NPM configuration (optional)
└── README.md
```

## Setup Instructions

### 1. Simple Setup (No Build Required)

The web app is built with vanilla HTML, CSS, and JavaScript. No build process is required.

Simply open `index.html` in a web browser or serve it using a simple HTTP server:

```bash
# Using Python 3
python3 -m http.server 3000

# Using Python 2
python -m SimpleHTTPServer 3000

# Using Node.js (http-server)
npx http-server -p 3000

# Using PHP
php -S localhost:3000
```

The app will be available at `http://localhost:3000`

### 2. Configuration

Update the API base URL in `app.js` if your backend is running on a different address:

```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

### 3. CORS Configuration

Ensure your Spring Boot backend is configured to allow CORS requests from the web app domain:

```java
// In SecurityConfig.java
.cors().configurationSource(request -> new CorsConfiguration().applyPermitDefaultValues())
```

## Usage

### For Guests

1. **Scan QR Code**: Guest scans the QR code provided at the event
2. **Allow Camera Access**: Grant camera permissions when prompted
3. **Capture Face**: Click "Start Camera" and then "Capture Face"
4. **View Photos**: Matched photos appear in the gallery
5. **Download**: Select and download individual photos or all photos as ZIP

### URL Format

The web app expects the event ID in the URL:

```
http://localhost:3000/?eventId=1
```

Or with path-based routing:

```
http://localhost:3000/event/1
```

## API Integration

The web app communicates with the Spring Boot backend via REST API:

### Endpoints Used

1. **Get Event Info**
   ```
   GET /api/guest/events/{eventId}
   ```

2. **Match Face**
   ```
   POST /api/guest/events/{eventId}/match-face
   Content-Type: multipart/form-data
   
   Parameters:
   - event_id: Event ID
   - image: Face image file
   ```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari 11+, Chrome Mobile)

### Required Features

- WebRTC (getUserMedia API)
- Canvas API
- Fetch API
- LocalStorage (optional)

## Security Considerations

- **No Authentication**: Guests don't need to log in
- **HTTPS Recommended**: Use HTTPS in production
- **CORS**: Configured to only accept requests from the backend
- **No Sensitive Data**: QR codes contain only event URLs
- **Rate Limiting**: Backend should implement rate limiting on face matching

## Performance Optimization

1. **Image Compression**: Images are compressed before upload
2. **Lazy Loading**: Photos can be loaded on demand
3. **Caching**: Browser caching for static assets
4. **CDN**: Serve static files from CDN in production

## Responsive Design

The app is fully responsive and works on:

- Desktop (1920px and up)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## Customization

### Styling

Modify `styles.css` to customize colors, fonts, and layout:

```css
/* Change primary color */
.btn-primary {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### Branding

Update the header in `app.js`:

```javascript
<h1>Your Event Name - Photo Gallery</h1>
```

### Translations

Add multi-language support by creating language files and updating text in `app.js`.

## Troubleshooting

### Camera Not Working

1. Check browser permissions for camera access
2. Ensure HTTPS is used (required by some browsers)
3. Try a different browser
4. Check if camera is already in use by another application

### Photos Not Loading

1. Verify backend is running
2. Check CORS configuration
3. Verify API base URL is correct
4. Check browser console for errors

### Face Not Detected

1. Ensure good lighting
2. Face should be clearly visible
3. Try a higher resolution image
4. Ensure face is not too small in the frame

### Download Not Working

1. Check browser download settings
2. Verify S3 URLs are accessible
3. Check browser console for CORS errors

## Development

### Adding New Features

1. Update HTML structure in `renderApp()`
2. Add CSS styles in `styles.css`
3. Add JavaScript logic in `app.js`
4. Test on multiple browsers and devices

### Testing

Manual testing checklist:

- [ ] Camera access works
- [ ] Face capture works
- [ ] Face matching returns results
- [ ] Photos display correctly
- [ ] Download works
- [ ] Responsive design works
- [ ] Works on mobile browsers
- [ ] Error messages display correctly

## Deployment

### Static Hosting

Deploy to any static hosting service:

- AWS S3 + CloudFront
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting

### Docker

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t event-photo-web-app .
docker run -p 3000:80 event-photo-web-app
```

### Production Checklist

- [ ] Use HTTPS
- [ ] Update API base URL
- [ ] Configure CORS properly
- [ ] Enable caching headers
- [ ] Minify CSS and JavaScript
- [ ] Optimize images
- [ ] Set up error tracking
- [ ] Configure CDN
- [ ] Set up monitoring

## Contributing

- Follow existing code style
- Add comments for complex logic
- Test on multiple browsers
- Ensure responsive design works
- Update documentation

## License

This project is part of the Event Photo Face Recognition Platform.
