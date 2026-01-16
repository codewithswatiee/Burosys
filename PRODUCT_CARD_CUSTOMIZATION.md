# Product Card Customization Guide

## Overview
The collection product cards have been styled to match the provided design with the following features:

### Features Implemented:
1. **Product Badge System** (FEATURED / READY TO SHIP)
2. **Product Title** - Centered, uppercase styling
3. **Product Price** - Centered, bold display
4. **Product Image** - Square aspect ratio with hover effects
5. **Image Navigation Dots** - Shows multiple product images
6. **Three-Column Info Grid**:
   - Lead Time
   - Color Swatches
   - Material
7. **"ADD TO PROJECT" Button** - Full width, black button

## Files Modified/Created:

### 1. `/blocks/_product-card.liquid` ✓
   - Complete redesign of the product card layout
   - Integrated custom styling directly into the block
   - Added badge logic based on product tags
   - Added product info grid with Lead Time, Color, and Material

### 2. `/assets/custom-product-card-styles.css` ✓
   - Standalone CSS file with all custom styles
   - Can be used as reference or imported separately

### 3. `/blocks/_custom-product-card-enhanced.liquid` ✓
   - Alternative standalone custom product card block
   - Can be used as a reference implementation

## How to Use:

### Adding Badges to Products:
Add tags to your products in Shopify admin:
- Add tag: `featured` or `FEATURED` → Shows red "FEATURED" badge
- Add tag: `ready-to-ship` or `READY TO SHIP` → Shows blue "READY TO SHIP" badge

### Setting Custom Product Properties:

#### Option 1: Using Product Metafields (Recommended)
1. Go to Shopify Admin → Settings → Custom Data → Products
2. Add metafield definitions:
   - **Lead Time**: 
     - Namespace: `custom`
     - Key: `lead_time`
     - Type: Single line text
     - Example value: "3 Weeks"
   
   - **Material**: 
     - Namespace: `custom`
     - Key: `material`
     - Type: Single line text
     - Example value: "Fabric"

3. Edit each product and fill in these metafields

#### Option 2: Default Values
If metafields are not set, the following defaults will be used:
- Lead Time: "3 Weeks"
- Material: "Fabric"

### Color Swatches:
The color swatches will automatically detect Color or Colour product variants and display them. If no color variants exist, it shows three default color swatches (brown, beige, blue).

Supported color classes (automatically styled):
- brown
- beige, tan, cream
- blue, navy
- (You can add more colors in the CSS section)

## Customization Options:

### Change Badge Colors:
Edit the CSS in `/blocks/_product-card.liquid`:
```css
.product-badge--featured {
  background-color: #ffffff;
  color: #dc2626; /* Change this color */
}

.product-badge--ready-to-ship {
  background-color: #ffffff;
  color: #2563eb; /* Change this color */
}
```

### Change Button Color:
```css
.add-to-project-btn {
  background-color: #000; /* Change button background */
  color: #fff; /* Change button text */
}
```

### Add More Color Swatches:
```css
.color-swatch.yourcolor {
  background-color: #hexcode;
}
```

### Adjust Spacing:
Modify padding and margin values in the CSS section

## Testing:

1. Go to your Shopify store's collection pages
2. Product cards should now display with the new styling
3. Add tags and metafields to products to see badges and custom info

## Responsive Design:
The cards are fully responsive and will adapt to mobile devices with:
- Single column info grid on mobile
- Adjusted font sizes
- Maintained functionality

## Browser Compatibility:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting:

**Cards not showing new design:**
- Clear your browser cache
- Make sure the changes are published in the Shopify theme editor

**Badges not showing:**
- Verify product tags are correctly formatted (case-insensitive)
- Check that products have the tags: 'featured' or 'ready-to-ship'

**Custom info not showing:**
- Check metafields are properly created in Shopify admin
- Ensure namespace is 'custom' and keys are 'lead_time' and 'material'

**Colors not showing correctly:**
- Verify product has Color/Colour variant option
- Add custom CSS for specific color names

## Need More Help?
Contact your Shopify developer or refer to Shopify's documentation on:
- Product tags
- Product metafields
- Theme customization
