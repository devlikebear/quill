/**
 * Template Loader Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateLoader } from '../../templates/loader.js';
import { BuiltinTemplate } from '../../templates/types.js';

describe('TemplateLoader', () => {
  let loader: TemplateLoader;

  beforeEach(() => {
    loader = new TemplateLoader();
  });

  describe('loadTemplate', () => {
    it('should load user-guide template', () => {
      const template = loader.loadTemplate('user-guide');

      expect(template).toBeDefined();
      expect(template.name).toBe('user-guide');
      expect(template.version).toBe('1.0.0');
      expect(template.description).toContain('End-user documentation');
    });

    it('should load technical template', () => {
      const template = loader.loadTemplate('technical');

      expect(template).toBeDefined();
      expect(template.name).toBe('technical');
      expect(template.format.uiElementsStyle).toBe('technical');
    });

    it('should load quick-start template', () => {
      const template = loader.loadTemplate('quick-start');

      expect(template).toBeDefined();
      expect(template.name).toBe('quick-start');
      expect(template.format.uiElementsStyle).toBe('scenario-based');
    });

    it('should throw error for non-existent template', () => {
      expect(() => loader.loadTemplate('non-existent')).toThrow();
    });
  });

  describe('loadBuiltinTemplate', () => {
    it('should load all builtin templates', () => {
      const userGuide = loader.loadBuiltinTemplate(BuiltinTemplate.UserGuide);
      const technical = loader.loadBuiltinTemplate(BuiltinTemplate.Technical);
      const quickStart = loader.loadBuiltinTemplate(BuiltinTemplate.QuickStart);

      expect(userGuide.name).toBe('user-guide');
      expect(technical.name).toBe('technical');
      expect(quickStart.name).toBe('quick-start');
    });
  });

  describe('template caching', () => {
    it('should cache loaded templates', () => {
      const template1 = loader.loadTemplate('user-guide');
      const template2 = loader.loadTemplate('user-guide');

      expect(template1).toBe(template2);
    });

    it('should respect cache option', () => {
      const loaderNoCache = new TemplateLoader({ cache: false });
      const template1 = loaderNoCache.loadTemplate('user-guide');
      const template2 = loaderNoCache.loadTemplate('user-guide');

      expect(template1).toEqual(template2);
      expect(template1).not.toBe(template2);
    });
  });

  describe('template validation', () => {
    it('should validate template structure', () => {
      const template = loader.loadTemplate('user-guide');

      expect(template.structure).toBeDefined();
      expect(template.structure.directories).toBeDefined();
      expect(template.structure.files).toBeDefined();
      expect(template.sections).toBeDefined();
      expect(template.format).toBeDefined();
    });

    it('should have required directories', () => {
      const template = loader.loadTemplate('user-guide');

      expect(template.structure.directories.root).toBe('docs');
      expect(template.structure.directories.navigation).toBe('docs/navigation');
      expect(template.structure.directories.pages).toBe('docs/pages');
    });

    it('should have required files', () => {
      const template = loader.loadTemplate('user-guide');

      expect(template.structure.files.index).toBe('index.md');
      expect(template.structure.files.sitemap).toBe('sitemap.md');
      expect(template.structure.files.gnb).toBe('navigation/global-navigation.md');
    });
  });
});
