/**
 * Feature Extractor Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureExtractor } from '../../generators/feature-extractor.js';
import type { PageInfo } from '../../types/index.js';

describe('FeatureExtractor', () => {
  let extractor: FeatureExtractor;

  beforeEach(() => {
    extractor = new FeatureExtractor();
  });

  const mockPages: PageInfo[] = [
    {
      url: 'https://example.com/login',
      title: 'Login Page',
      description: 'User authentication',
      elements: [
        {
          type: 'input',
          text: 'Email',
          description: 'Enter your email',
        },
        {
          type: 'input',
          text: 'Password',
          description: 'Enter your password',
        },
        {
          type: 'button',
          text: 'Sign In',
          description: 'Submit login form',
        },
      ],
    },
    {
      url: 'https://example.com/search',
      title: 'Search Page',
      description: 'Search products',
      elements: [
        {
          type: 'input',
          text: 'Search',
          description: 'Search for products',
        },
        {
          type: 'button',
          text: 'Filter',
          description: 'Apply filters',
        },
      ],
    },
  ];

  describe('extract', () => {
    it('should extract features with technical style', () => {
      const features = extractor.extract(mockPages, 'technical');

      expect(features.length).toBeGreaterThan(0);

      const authFeature = features.find((f) => f.name === 'Authentication');
      expect(authFeature).toBeDefined();
      expect(authFeature?.elements.length).toBeGreaterThan(0);
    });

    it('should extract features with functional style', () => {
      const features = extractor.extract(mockPages, 'functional');

      const authFeature = features.find((f) => f.name === 'Authentication');
      expect(authFeature).toBeDefined();

      const emailElement = authFeature?.elements.find((e) => e.text === 'Email');
      expect(emailElement?.description).toContain('Enter');
    });

    it('should extract features with scenario-based style', () => {
      const features = extractor.extract(mockPages, 'scenario-based');

      const authFeature = features.find((f) => f.name === 'Authentication');
      expect(authFeature).toBeDefined();
      expect(authFeature?.scenario).toBeDefined();
      expect(authFeature?.scenario).toContain('When');
    });

    it('should group elements by feature', () => {
      const features = extractor.extract(mockPages, 'functional');

      const authFeature = features.find((f) => f.name === 'Authentication');
      const searchFeature = features.find((f) => f.name === 'Search');

      expect(authFeature).toBeDefined();
      expect(searchFeature).toBeDefined();
    });

    it('should track pages for each feature', () => {
      const features = extractor.extract(mockPages, 'functional');

      const authFeature = features.find((f) => f.name === 'Authentication');
      expect(authFeature?.pages).toContain('login');
    });
  });

  describe('feature grouping', () => {
    it('should infer authentication feature from login elements', () => {
      const pages: PageInfo[] = [
        {
          url: 'https://example.com',
          title: 'Home',
          elements: [
            { type: 'button', text: 'Login' },
            { type: 'button', text: 'Sign Up' },
          ],
        },
      ];

      const features = extractor.extract(pages, 'functional');
      const authFeature = features.find((f) => f.name === 'Authentication');

      expect(authFeature).toBeDefined();
    });

    it('should infer search feature from search elements', () => {
      const pages: PageInfo[] = [
        {
          url: 'https://example.com',
          title: 'Home',
          elements: [{ type: 'input', text: 'Search products' }],
        },
      ];

      const features = extractor.extract(pages, 'functional');
      const searchFeature = features.find((f) => f.name === 'Search');

      expect(searchFeature).toBeDefined();
    });
  });

  describe('element descriptions', () => {
    it('should generate user-friendly functional descriptions', () => {
      const pages: PageInfo[] = [
        {
          url: 'https://example.com',
          title: 'Test',
          elements: [
            { type: 'button', text: 'Submit' },
            { type: 'input', text: 'Name' },
            { type: 'link', text: 'Dashboard' },
          ],
        },
      ];

      const features = extractor.extract(pages, 'functional');
      const elements = features.flatMap((f) => f.elements);

      const buttonDesc = elements.find((e) => e.type === 'button')?.description;
      const inputDesc = elements.find((e) => e.type === 'input')?.description;
      const linkDesc = elements.find((e) => e.type === 'link')?.description;

      expect(buttonDesc).toContain('Click');
      expect(inputDesc).toContain('Enter');
      expect(linkDesc).toContain('Navigate');
    });

    it('should generate scenario-based descriptions', () => {
      const pages: PageInfo[] = [
        {
          url: 'https://example.com',
          title: 'Test',
          elements: [{ type: 'button', text: 'Save' }],
        },
      ];

      const features = extractor.extract(pages, 'scenario-based');
      const elements = features.flatMap((f) => f.elements);

      const description = elements[0]?.description;
      expect(description).toContain('When');
    });
  });
});
