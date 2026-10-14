import assert from 'node:assert/strict';
import {
  classifyMediaUrl,
  stripBlankTestimonialMedia,
  testimonialMediaError,
  visibleTestimonialMedia,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
} from './testimonialMedia.js';

const items = [
  {
    name: 'Rajesh M.',
    text: 'Kept',
    rating: 5,
    media: [
      { type: 'image', url: '  ' },
      { type: 'image', url: 'https://cdn.example.com/a.jpg' },
      { type: 'video', url: 'https://youtu.be/dQw4w9WgVcQ', poster: 'https://cdn.example.com/p.png' },
    ],
  },
];

assert.equal(testimonialMediaError(items), '');
const stripped = stripBlankTestimonialMedia(items);
assert.equal(stripped[0].name, 'Rajesh M.');
assert.equal(stripped[0].text, 'Kept');
assert.equal(stripped[0].rating, 5);
assert.equal(stripped[0].media.length, 2);
assert.equal(stripped[0].media[0].url, 'https://cdn.example.com/a.jpg');

assert.match(testimonialMediaError([
  { media: [{ type: 'image', url: 'javascript:alert(1)' }] },
]), /not allowed/i);

assert.match(testimonialMediaError([
  { media: [{ type: 'image', url: '/backend/uploads/patient-reports/9/x.jpg' }] },
]), /private patient files/i);

assert.match(testimonialMediaError([
  { media: [{ type: 'video', url: 'https://cdn.example.com/shell.php.mp4' }] },
]), /file type/i);

assert.equal(classifyMediaUrl('/backend/uploads/cms-video/clip.mp4', 'video').ok, true);
assert.equal(classifyMediaUrl('/backend/uploads/cms-images/photo.webp', 'image').ok, true);
assert.equal(classifyMediaUrl('https://vimeo.com/123456789', 'video').ok, true);
assert.equal(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgVcQ').includes('dQw4w9WgVcQ'), true);
assert.equal(vimeoEmbedUrl('https://vimeo.com/123456789'), 'https://player.vimeo.com/video/123456789');

const visible = visibleTestimonialMedia([
  { type: 'image', url: 'javascript:alert(1)' },
  { type: 'image', url: 'https://cdn.example.com/ok.gif', alt: 'Stretch' },
]);
assert.equal(visible.length, 1);
assert.equal(visible[0].alt, 'Stretch');

const blank = [{ name: 'Only text', media: [{ type: 'image', url: '' }] }];
assert.equal(testimonialMediaError(blank), '');
assert.deepEqual(stripBlankTestimonialMedia(blank)[0].media, []);

console.log('testimonial media client checks passed');
