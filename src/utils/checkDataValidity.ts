// import { checkPagesValidity } from "@/services/WikipediaService";

// const checkDataValidity = async () => {
//     console.log("Checking data validity...");
//     const titles: string[] = [] 

//     try {
//         // Check the stars.csv validity by checking wikipedia pages
//         const response = await fetch('http://localhost:3000/api/read-csv');
//         const data = await response.json();
//         // get names into an array
//         data.forEach((element: any) => {
//             titles.push(element.name);
//         });
//     } catch (error) {
//         console.error('Erreur lors de la lecture du csv', error);
//     }


//     const incorrectTitles = await checkPagesValidity(titles);

//     if (incorrectTitles.length === 0) {
//         console.log("All titles are valid");
//     } else {
//         console.log("Incorrect titles: ", incorrectTitles);
//     }
// }

// export default checkDataValidity;