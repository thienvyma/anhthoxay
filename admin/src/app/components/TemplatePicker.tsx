import type { SectionKind } from '../types';

interface Template {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>;
  preview?: string;
}

interface TemplatePickerProps {
  kind: SectionKind;
  onSelect: (data: Record<string, any>) => void;
  onClose: () => void;
}

const TEMPLATES: Record<SectionKind, Template[]> = {
  HERO: [
    {
      id: 'hero-modern',
      name: 'Modern Hero',
      description: 'Clean, minimalist hero with large image',
      data: {
        title: 'Welcome to The Divine Cuisine',
        subtitle: 'Experience culinary excellence with AI-powered service',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
        ctaText: 'Book Your Table',
        ctaLink: '/contact',
      },
    },
    {
      id: 'hero-elegant',
      name: 'Elegant Hero',
      description: 'Sophisticated design with gradient overlay',
      data: {
        title: 'Exquisite Dining Experience',
        subtitle: 'Where tradition meets innovation',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
        ctaText: 'Explore Menu',
        ctaLink: '/menu',
      },
    },
    {
      id: 'hero-bold',
      name: 'Bold Hero',
      description: 'Eye-catching design with strong typography',
      data: {
        title: 'Taste the Difference',
        subtitle: 'Premium ingredients, masterful preparation',
        imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80',
        ctaText: 'Reserve Now',
        ctaLink: '/reservations',
      },
    },
  ],
  
  FEATURED_MENU: [
    {
      id: 'menu-grid',
      name: 'Grid Layout',
      description: '3-column grid with images',
      data: {
        title: 'Featured Dishes',
        subtitle: "Our chef's specialties",
        items: [
          {
            name: 'Grilled Salmon',
            description: 'Fresh Atlantic salmon with herbs',
            price: '380,000đ',
            imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500',
          },
          {
            name: 'Wagyu Steak',
            description: 'Premium Japanese beef',
            price: '650,000đ',
            imageUrl: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=500',
          },
          {
            name: 'Lobster Thermidor',
            description: 'Classic French preparation',
            price: '550,000đ',
            imageUrl: 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=500',
          },
        ],
      },
    },
    {
      id: 'menu-list',
      name: 'List Layout',
      description: 'Simple list with descriptions',
      data: {
        title: 'Our Signature Menu',
        subtitle: 'Curated by our executive chef',
        items: [
          {
            name: 'Truffle Risotto',
            description: 'Creamy Italian rice with black truffle',
            price: '420,000đ',
            imageUrl: 'https://images.unsplash.com/photo-1476124369491-f66aa3e2c792?w=500',
          },
          {
            name: 'Duck Confit',
            description: 'Slow-cooked duck leg with orange glaze',
            price: '480,000đ',
            imageUrl: 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=500',
          },
        ],
      },
    },
  ],

  TESTIMONIALS: [
    {
      id: 'testimonials-cards',
      name: 'Card Style',
      description: 'Modern cards with avatars',
      data: {
        title: 'What Our Customers Say',
        subtitle: 'Real reviews from real people',
        testimonials: [
          {
            name: 'Sarah Johnson',
            role: 'Food Blogger',
            avatar: 'https://i.pravatar.cc/150?img=5',
            rating: 5,
            content: 'Absolutely amazing! The food was exceptional and the AI service was surprisingly personal.',
          },
          {
            name: 'Michael Chen',
            role: 'Business Executive',
            avatar: 'https://i.pravatar.cc/150?img=12',
            rating: 5,
            content: 'Perfect for business dinners. The atmosphere is elegant and the service is impeccable.',
          },
        ],
      },
    },
    {
      id: 'testimonials-minimal',
      name: 'Minimal Style',
      description: 'Clean quotes layout',
      data: {
        title: 'Customer Reviews',
        subtitle: 'Hear from our satisfied guests',
        testimonials: [
          {
            name: 'Emma Wilson',
            role: 'Restaurant Critic',
            avatar: 'https://i.pravatar.cc/150?img=9',
            rating: 5,
            content: 'A culinary journey worth taking. Every dish tells a story.',
          },
        ],
      },
    },
  ],

  STATS: [
    {
      id: 'stats-achievements',
      name: 'Achievements',
      description: 'Highlight awards and milestones',
      data: {
        title: 'Our Achievements',
        subtitle: 'Numbers that speak for themselves',
        stats: [
          { icon: 'ri-award-line', value: 15, label: 'Awards Won', suffix: '+' },
          { icon: 'ri-user-smile-line', value: 10000, label: 'Happy Customers', suffix: '+' },
          { icon: 'ri-restaurant-line', value: 150, label: 'Menu Items', suffix: '+' },
          { icon: 'ri-star-line', value: 4.9, label: 'Average Rating', prefix: '⭐' },
        ],
      },
    },
    {
      id: 'stats-experience',
      name: 'Experience',
      description: 'Focus on expertise and quality',
      data: {
        title: 'Years of Excellence',
        subtitle: 'Committed to quality since day one',
        stats: [
          { icon: 'ri-time-line', value: 25, label: 'Years Experience', suffix: '+' },
          { icon: 'ri-team-line', value: 50, label: 'Expert Chefs', suffix: '+' },
          { icon: 'ri-global-line', value: 30, label: 'International Dishes', suffix: '+' },
          { icon: 'ri-heart-line', value: 99, label: 'Customer Satisfaction', suffix: '%' },
        ],
      },
    },
  ],

  CTA: [
    {
      id: 'cta-centered',
      name: 'Centered CTA',
      description: 'Bold centered call-to-action',
      data: {
        title: 'Ready to Dine With Us?',
        description: 'Book your table now and enjoy an unforgettable culinary experience',
        buttonText: 'Reserve Your Table',
        buttonLink: '/contact',
      },
    },
    {
      id: 'cta-offer',
      name: 'Special Offer',
      description: 'CTA with promotional message',
      data: {
        title: 'Limited Time Offer',
        description: 'Get 20% off your first reservation. Use code: WELCOME20',
        buttonText: 'Claim Your Discount',
        buttonLink: '/contact',
      },
    },
  ],

  GALLERY: [
    {
      id: 'gallery-masonry',
      name: 'Masonry Grid',
      description: 'Pinterest-style image grid',
      data: {
        title: 'Our Gallery',
        subtitle: 'A glimpse into our world',
        images: [
          { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', alt: 'Restaurant interior' },
          { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', alt: 'Dining area' },
          { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', alt: 'Food presentation' },
          { url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800', alt: 'Chef at work' },
        ],
      },
    },
  ],

  CONTACT_INFO: [
    {
      id: 'contact-full',
      name: 'Full Contact Info',
      description: 'Complete contact information with hours, map & social media',
      data: {
        title: 'Liên Hệ & Địa Chỉ',
        phone: '+84 123 456 789',
        email: 'contact@thedivine.com',
        address: '123 Gourmet Street, Food District, Ho Chi Minh City',
        hours: [
          { day: 'Thứ 2 - Thứ 6', time: '10:00 - 22:00' },
          { day: 'Thứ 7 - Chủ nhật', time: '09:00 - 23:00' },
        ],
        mapEmbedUrl: '',
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/yourpage' },
          { platform: 'instagram', url: 'https://instagram.com/yourpage' },
          { platform: 'youtube', url: 'https://youtube.com/@yourpage' },
        ],
      },
    },
  ],

  RICH_TEXT: [
    {
      id: 'richtext-about',
      name: 'About Us',
      description: 'Story about the restaurant',
      data: {
        content: `# About The Divine Cuisine

We believe in creating memorable dining experiences through the perfect blend of culinary artistry and innovative technology.

## Our Story

Founded in 2020, The Divine Cuisine has been at the forefront of culinary innovation, combining traditional cooking techniques with AI-powered service excellence.

## Our Philosophy

- **Quality First**: We source only the finest ingredients
- **Innovation**: Embracing technology to enhance service
- **Sustainability**: Committed to eco-friendly practices`,
      },
    },
  ],

  TEAM: [
    {
      id: 'team-grid',
      name: 'Team Grid',
      description: 'Showcase your team members',
      data: {
        title: 'Meet Our Team',
        subtitle: 'The talented people behind your experience',
        members: [
          {
            name: 'Chef Alexandre Dubois',
            role: 'Executive Chef',
            imageUrl: 'https://i.pravatar.cc/400?img=33',
            bio: '20+ years of culinary excellence',
          },
          {
            name: 'Maria Santos',
            role: 'Sous Chef',
            imageUrl: 'https://i.pravatar.cc/400?img=47',
            bio: 'Specializing in Asian fusion',
          },
        ],
      },
    },
  ],

  FAQ: [
    {
      id: 'faq-standard',
      name: 'Standard FAQ',
      description: 'Common questions and answers',
      data: {
        title: 'Frequently Asked Questions',
        subtitle: 'Everything you need to know',
        faqs: [
          {
            question: 'Do you take reservations?',
            answer: 'Yes! We highly recommend making reservations, especially for dinner service.',
          },
          {
            question: 'What are your payment options?',
            answer: 'We accept cash, credit cards, and digital payments.',
          },
          {
            question: 'Do you offer vegetarian options?',
            answer: 'Absolutely! We have a dedicated vegetarian menu with creative plant-based dishes.',
          },
        ],
      },
    },
  ],

  VIDEO: [
    {
      id: 'video-youtube',
      name: 'YouTube Video',
      description: 'Embed a YouTube video',
      data: {
        title: 'Watch Our Story',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
    },
  ],
};

export function TemplatePicker({ kind, onSelect, onClose }: TemplatePickerProps) {
  const templates = TEMPLATES[kind] || [];

  if (templates.length === 0) {
    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-gray-400 mb-4">No templates available for this section type yet.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <i className="ri-sparkling-line" style={{ fontSize: '20px', color: '#f5d393' }} />
                Choose a Template
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Start with a pre-designed template for {kind.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(template.data);
                  onClose();
                }}
                className="group relative bg-gray-900 border border-gray-700 rounded-lg p-6 text-left hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <i className="ri-star-line" style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1 group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-400">{template.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <i className="ri-flashlight-line" style={{ fontSize: '14px' }} />
                  <span>Click to use template</span>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

