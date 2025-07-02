# Reu Uzziel Portfolio

A modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Modern UI/UX design
- Responsive layout
- Smooth animations with Framer Motion
- Contact form
- Project showcase
- Services section
- SEO optimized
- Environment variable configuration for easy deployment

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- React Intersection Observer
- Heroicons

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
# Public Variables (accessible in browser)
NEXT_PUBLIC_CONTACT_EMAIL=your.email@example.com
NEXT_PUBLIC_LOCATION="Your City, Country"
NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/in/your-profile
NEXT_PUBLIC_GITHUB_URL=https://github.com/your-username
NEXT_PUBLIC_DRIBBBLE_URL=https://dribbble.com/your-username
NEXT_PUBLIC_PROFILE_IMAGE=https://placehold.co/600x800
NEXT_PUBLIC_PROJECT1_IMAGE=https://placehold.co/600x400
NEXT_PUBLIC_PROJECT2_IMAGE=https://placehold.co/600x400
NEXT_PUBLIC_PROJECT3_IMAGE=https://placehold.co/600x400

# API Configuration (for future use)
API_URL=http://localhost:3000/api
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
portfolio/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Navigation.tsx
│   │   ├── Hero.tsx
│   │   ├── Projects.tsx
│   │   ├── Services.tsx
│   │   └── Contact.tsx
│   └── styles/
├── public/
│   └── images/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Environment Variables

The portfolio uses environment variables for configuration. In development, these are loaded from `.env.local`. For production deployment:

1. Local Development:
   - Create `.env.local` with development values
   - Images will default to placeholders if not specified

2. Production Deployment:
   - Configure environment variables in your hosting platform (e.g., Vercel)
   - Update image URLs to point to your production assets
   - Set API configuration if using a backend

## Deployment

This project is optimized for deployment on Vercel:

1. Push your code to a GitHub repository
2. Import your repository on Vercel
3. Configure environment variables in Vercel's project settings
4. Deploy!

For other platforms, ensure you:
- Set up environment variables
- Configure build settings (`npm run build`)
- Set up any necessary redirects for SPA routing

## Customization

1. Update environment variables with your information
2. Replace placeholder images with your own
3. Modify the color scheme in `tailwind.config.js`
4. Update the contact form handling in `Contact.tsx`

## License

MIT License - feel free to use this template for your own portfolio!

## Contact

Reu Uzziel - [Your Email] - [Your LinkedIn] 