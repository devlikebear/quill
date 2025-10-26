/**
 * Feature Extractor - Extracts and groups features from UI elements
 */

import type { PageInfo, UIElement } from '../types/index.js';
import type { Feature, UIElementInfo } from '../templates/types.js';
import { logger } from '../utils/logger.js';

/**
 * Feature Extractor
 */
export class FeatureExtractor {
  /**
   * Extract features from pages based on UI elements style
   */
  extract(
    pages: PageInfo[],
    uiElementsStyle: 'technical' | 'functional' | 'scenario-based'
  ): Feature[] {
    logger.info(`Extracting features with ${uiElementsStyle} style...`);

    const features: Feature[] = [];

    // Group UI elements by functional area
    const featureGroups = this.groupByFeature(pages);

    for (const [featureName, group] of featureGroups) {
      const feature: Feature = {
        id: this.generateFeatureId(featureName),
        name: featureName,
        description: this.generateDescription(featureName, group.elements, uiElementsStyle),
        pages: group.pages,
        elements: group.elements.map((el) => this.transformElement(el, uiElementsStyle)),
        scenario: uiElementsStyle === 'scenario-based' ? this.generateScenario(featureName) : undefined,
      };

      features.push(feature);
    }

    logger.info(`Extracted ${features.length} features`);
    return features;
  }

  /**
   * Group UI elements by functional feature
   */
  private groupByFeature(pages: PageInfo[]): Map<
    string,
    {
      pages: string[];
      elements: UIElement[];
    }
  > {
    const groups = new Map<
      string,
      {
        pages: string[];
        elements: UIElement[];
      }
    >();

    for (const page of pages) {
      if (!page.elements || page.elements.length === 0) continue;

      const pageId = this.generatePageId(page.url);

      // Group elements by type
      const elementsByType = new Map<string, UIElement[]>();
      for (const element of page.elements) {
        const featureName = this.inferFeatureName(element);
        if (!elementsByType.has(featureName)) {
          elementsByType.set(featureName, []);
        }
        elementsByType.get(featureName)!.push(element);
      }

      // Add to feature groups
      for (const [featureName, elements] of elementsByType) {
        if (!groups.has(featureName)) {
          groups.set(featureName, { pages: [], elements: [] });
        }
        const group = groups.get(featureName)!;
        if (!group.pages.includes(pageId)) {
          group.pages.push(pageId);
        }
        group.elements.push(...elements);
      }
    }

    return groups;
  }

  /**
   * Infer feature name from UI element
   */
  private inferFeatureName(element: UIElement): string {
    // Try to infer from text content
    const text = element.text || '';

    // Common feature patterns
    if (text.toLowerCase().includes('login') || text.toLowerCase().includes('sign in')) {
      return 'Authentication';
    }
    if (text.toLowerCase().includes('search')) {
      return 'Search';
    }
    if (text.toLowerCase().includes('filter')) {
      return 'Filtering';
    }
    if (text.toLowerCase().includes('submit') || text.toLowerCase().includes('save')) {
      return 'Data Submission';
    }
    if (text.toLowerCase().includes('edit') || text.toLowerCase().includes('update')) {
      return 'Data Modification';
    }
    if (text.toLowerCase().includes('delete') || text.toLowerCase().includes('remove')) {
      return 'Data Deletion';
    }
    if (text.toLowerCase().includes('navigation') || text.toLowerCase().includes('menu')) {
      return 'Navigation';
    }

    // Fallback to element type
    const typeMap: Record<string, string> = {
      button: 'Interactive Actions',
      input: 'Data Input',
      form: 'Form Submission',
      link: 'Navigation',
      section: 'Content Display',
      heading: 'Content Organization',
    };

    return typeMap[element.type] || 'General Features';
  }

  /**
   * Transform UI element based on style
   */
  private transformElement(
    element: UIElement,
    style: 'technical' | 'functional' | 'scenario-based'
  ): UIElementInfo {
    const base: UIElementInfo = {
      type: element.type,
      text: element.text || '',
      description: '',
    };

    switch (style) {
      case 'technical':
        base.description = `${element.type} element${element.ariaLabel ? ` (${element.ariaLabel})` : ''}`;
        break;

      case 'functional':
        base.description = this.generateFunctionalDescription(element);
        break;

      case 'scenario-based':
        base.description = this.generateScenarioDescription(element);
        break;
    }

    return base;
  }

  /**
   * Generate functional description for element
   */
  private generateFunctionalDescription(element: UIElement): string {
    const text = element.text || 'this element';

    switch (element.type) {
      case 'button':
        return `Click "${text}" to perform the action`;
      case 'input':
        return `Enter information in the "${text}" field`;
      case 'form':
        return `Complete and submit the "${text}" form`;
      case 'link':
        return `Navigate to "${text}"`;
      case 'section':
        return `View information in the "${text}" section`;
      case 'heading':
        return `Section titled "${text}"`;
      default:
        return `Interact with "${text}"`;
    }
  }

  /**
   * Generate scenario-based description for element
   */
  private generateScenarioDescription(element: UIElement): string {
    const text = element.text || 'this element';

    switch (element.type) {
      case 'button':
        return `When you want to proceed, click the "${text}" button`;
      case 'input':
        return `You can provide your information by typing in the "${text}" field`;
      case 'form':
        return `To complete this task, fill out the "${text}" form and submit`;
      case 'link':
        return `If you need to access "${text}", click this link`;
      default:
        return `Use "${text}" to interact with this feature`;
    }
  }

  /**
   * Generate feature description
   */
  private generateDescription(
    featureName: string,
    elements: UIElement[],
    style: 'technical' | 'functional' | 'scenario-based'
  ): string {
    const elementCount = elements.length;

    switch (style) {
      case 'technical':
        return `${featureName} consists of ${elementCount} UI element${elementCount > 1 ? 's' : ''}`;

      case 'functional':
        return `${featureName} provides functionality through ${elementCount} interactive element${elementCount > 1 ? 's' : ''}`;

      case 'scenario-based':
        return `Users can accomplish ${featureName.toLowerCase()} tasks using the available ${elementCount} element${elementCount > 1 ? 's' : ''}`;

      default:
        return featureName;
    }
  }

  /**
   * Generate usage scenario for feature
   */
  private generateScenario(featureName: string): string {
    const scenarios: Record<string, string> = {
      Authentication: 'When you need to access protected areas, use this feature to log in',
      Search: 'When looking for specific content, use the search feature to find it quickly',
      Filtering: 'When you need to narrow down results, apply filters to find what you need',
      'Data Submission': 'When you want to save your information, submit the form',
      Navigation: 'When you need to move between different sections, use the navigation menu',
    };

    return scenarios[featureName] || `Use this feature when you need ${featureName.toLowerCase()}`;
  }

  /**
   * Generate feature ID from name
   */
  private generateFeatureId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate page ID from URL
   */
  private generatePageId(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      const id = pathname
        .replace(/^\/+|\/+$/g, '')
        .replace(/\//g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase();

      return id || 'index';
    } catch {
      return url
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase()
        .slice(0, 50);
    }
  }
}
