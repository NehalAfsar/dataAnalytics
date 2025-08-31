# Data Dashboard Tool

A comprehensive web-based dashboard tool for uploading CSV/Excel files and creating interactive data visualizations.

## Features

### ✨ Core Features
- **File Upload & Parsing**: Accept .csv, .xls, .xlsx files with drag-and-drop support
- **Data Analysis**: Auto-generate insights (sum, avg, min, max, count)
- **Interactive Visualizations**: Bar charts, line charts, pie charts, doughnut charts, scatter plots
- **Dynamic Chart Configuration**: Change chart types, customize titles, axes, colors
- **Data Filtering**: Filter data by columns and values
- **Dashboard Customization**: Drag-and-drop chart rearrangement
- **Export Options**: Export to PDF, PNG, Excel formats

### 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: TailwindCSS
- **Charts**: Chart.js
- **File Processing**: PapaParse (CSV), SheetJS (Excel)
- **Export**: jsPDF, html2canvas, FileSaver.js

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server installation required - runs directly in browser

### Installation
1. Download or clone the project files
2. Open `index.html` in your web browser
3. Start uploading data files and creating dashboards!

### Usage

#### 1. Upload Data
- Click "Choose File" or drag-and-drop your CSV/Excel file
- Supported formats: .csv, .xls, .xlsx
- The tool automatically detects headers and data types

#### 2. View Data Preview
- See your data in a clean table format
- First 100 rows are displayed for quick preview
- All columns are automatically detected

#### 3. Analyze Data
- View automatic statistics for numeric columns
- Statistics include: count, sum, average, min, max
- Updated automatically when filters are applied

#### 4. Filter Data
- Select any column to filter by
- Enter a value to filter the data
- Apply or clear filters as needed
- All visualizations update automatically

#### 5. Create Visualizations
- Choose chart type: Bar, Line, Pie, Doughnut, Scatter
- Select X and Y axis columns
- Add custom chart titles
- Charts are automatically generated

#### 6. Customize Dashboard
- Add multiple charts to your dashboard
- Drag and drop to rearrange chart positions
- Remove charts using the X button
- Each chart can have different configurations

#### 7. Export Your Work
- **PDF**: Statistical report with all insights
- **PNG**: High-quality image of the entire dashboard
- **Excel**: Raw data and statistics in separate sheets

## Sample Data

Use the included `sample-data.csv` file to test the dashboard:
- Contains sales data with dates, regions, products, and quantities
- Perfect for demonstrating all chart types and filtering capabilities
- Shows business vs individual customer types

## Example Workflow

1. Upload `sample-data.csv`
2. Filter by Region = "North" to see northern sales
3. Create a bar chart with Product (X-axis) and Sales (Y-axis)
4. Add a pie chart showing Sales by Customer_Type
5. Drag charts to arrange them as desired
6. Export the dashboard as PNG for sharing

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 90+

## File Size Limitations

- CSV files: Up to 10MB recommended
- Excel files: Up to 5MB recommended
- Large files may take longer to process

## Troubleshooting

### File Upload Issues
- Ensure file format is .csv, .xls, or .xlsx
- Check that file is not corrupted
- Try with a smaller file first

### Chart Display Problems
- Ensure both X and Y axes are selected
- Check that Y-axis column contains numeric data
- Refresh page if charts don't appear

### Export Issues
- Allow pop-ups for PDF downloads
- Ensure sufficient browser storage for large exports
- Use Chrome for best export compatibility

## Advanced Features

### Data Types
- Automatically detects numeric vs text columns
- Numeric columns appear in statistics
- Text columns work well for X-axis grouping

### Chart Customization
- Charts automatically use color schemes
- Pie/Doughnut charts show legends
- Bar/Line charts show axis labels

### Performance
- Optimized for files up to 10,000 rows
- Charts limited to 20 data points for clarity
- Automatic data aggregation for performance

## Contributing

This is a standalone tool designed for simplicity and ease of use. To modify:

1. Edit `index.html` for UI changes
2. Edit `app.js` for functionality changes
3. Test with various data files
4. Ensure all browsers still work

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify your file format and size
3. Test with the sample data file
4. Try in a different browser

---

**Happy Data Visualization!** 📊✨
