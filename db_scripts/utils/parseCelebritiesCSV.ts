import fs from 'fs';
import csvParser from 'csv-parser';

export interface Celebrity {
  name: string;
  category: string;
  nationality: string;
  short_description: string;
}

const parseCelebritiesCSV = async (): Promise<Celebrity[]> => {
  const celebrities: Celebrity[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream('data/celebrities.csv') // Adjust the file path as needed
      .pipe(
        csvParser({
          headers: ['Name', 'Category', 'Nationality', 'Description', '', ''],
          skipLines: 1, // Skip header row if present
        }),
      )
      .on('data', (row) => {
        const celebrity: Celebrity = {
          name: row['Name'].trim(),
          category: row['Category'].trim(),
          nationality: row['Nationality'].trim(),
          short_description: row['Description'].trim(),
        };
        celebrities.push(celebrity);
      })
      .on('end', () => {
        resolve(celebrities);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

export { parseCelebritiesCSV };
