export interface TastedItem {
  itemName: string;
  foodTaste: string;
  qualityOfIngredients: string;
  freshnessOfFood: string;
  foodTemperature: string;
  foodPresentation: string;
  imageUrl?: string;
}

export interface BeverageItem {
  itemName: string;
  drinkQuality: string;
  drinkFlavorBalance: string;
  responseTime: string;
  imageUrl?: string;
}

export interface SurveyData {
  date: string;
  name: string;
  employeeId: string;
  hotel: string;
  restaurant: string;
  timeOfService: string;
  typeOfService: string;
  tastedItems: TastedItem[];
  beverageItems: BeverageItem[];
  promptnessOfService: string;
  attentivenessAndCare: string;
  cleanliness: string;
  value: string;
  comments: string;
}

export interface StoredSurvey extends SurveyData {
  id: string;
  createdAt: string;
}
