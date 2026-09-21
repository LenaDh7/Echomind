const STORY_LIBRARY = [
  // diff 0
  { id:"apple", minDiff:0, text:"Mark washed an apple and then ate it.", mode:"both",
    scenes:[{emoji:"🍎🚿",label:"Washing the apple"},{emoji:"😋🍎",label:"Eating the apple"}],
    question:"What did Mark do first?", choices:["He ate the apple","He washed the apple","He peeled the apple"], answer:1 },

  { id:"sun_rain", minDiff:0, text:"First the sun was shining, then it started to rain.", mode:"both",
    scenes:[{emoji:"☀️",label:"Sunny day"},{emoji:"🌧️",label:"Rainy day"}],
    question:"What happened after the sun was shining?", choices:["It got dark","It started to rain","There was snow"], answer:1 },

  { id:"dog_walk", minDiff:0, text:"Sara put on her shoes and then walked her dog.", mode:"both",
    scenes:[{emoji:"👟",label:"Putting on shoes"},{emoji:"🐕🚶",label:"Walking the dog"}],
    question:"What did Sara do before walking her dog?", choices:["She fed the dog","She put on her shoes","She called a friend"], answer:1 },

  { id:"cats", minDiff:0, text:"I was playing with Mary and we saw two cats sitting on a fence.", mode:"question",
    question:"How many cats did they see?", choices:["One","Two","Three"], answer:1 },

  { id:"school_morning", minDiff:0, text:"Tom woke up, got dressed, and had breakfast before going to school.", mode:"order",
    scenes:[{emoji:"😴➡️😊",label:"Woke up"},{emoji:"👕",label:"Got dressed"},{emoji:"🥣",label:"Had breakfast"}] },

  // diff 1
  { id:"bake_cake", minDiff:1, text:"Lily mixed the ingredients, put the cake in the oven, and waited for it to bake.", mode:"order",
    scenes:[{emoji:"🥣🥄",label:"Mixing ingredients"},{emoji:"🎂🔥",label:"Baking in oven"},{emoji:"⏳",label:"Waiting"}] },

  { id:"fish_pond", minDiff:1, text:"Jake went to the pond and caught three fish. He kept one and threw two back.", mode:"question",
    question:"How many fish did Jake throw back?", choices:["One","Two","Three"], answer:1 },

  { id:"garden", minDiff:1, text:"Emma planted some seeds, watered them every day, and after a week she saw little green shoots.", mode:"both",
    scenes:[{emoji:"🌱",label:"Planting seeds"},{emoji:"💧🌱",label:"Watering seeds"},{emoji:"🌿",label:"Seeing shoots"}],
    question:"What did Emma see after a week?", choices:["Flowers blooming","Little green shoots","A big tree"], answer:1 },

  { id:"library", minDiff:1, text:"Anna went to the library and borrowed four books. She read two of them before bedtime.", mode:"question",
    question:"How many books did Anna borrow?", choices:["Two","Three","Four"], answer:2 },

  // diff 2
  { id:"camping", minDiff:2, text:"The family packed their bags, drove to the forest, set up a tent, and cooked dinner over a campfire.", mode:"order",
    scenes:[{emoji:"🎒",label:"Packing bags"},{emoji:"🚗🌲",label:"Driving to forest"},{emoji:"⛺",label:"Setting up tent"},{emoji:"🔥🍖",label:"Cooking dinner"}] },

  { id:"market", minDiff:2, text:"Mia went to the market and bought five oranges, two apples, and a loaf of bread.", mode:"question",
    question:"How many apples did Mia buy?", choices:["One","Two","Five"], answer:1 },

  { id:"birthday", minDiff:2, text:"It was Leo's birthday. He got six presents. He opened three before lunch and the rest after.", mode:"question",
    question:"How many presents did Leo open after lunch?", choices:["Three","Four","Six"], answer:0 },

  { id:"rocket", minDiff:2, text:"The astronauts trained for months, boarded the rocket, launched into space, and orbited the Earth.", mode:"order",
    scenes:[{emoji:"🏋️",label:"Training"},{emoji:"🚀🧑‍🚀",label:"Boarding rocket"},{emoji:"🔥🚀",label:"Launch"},{emoji:"🌍🔭",label:"Orbiting Earth"}] },

  // diff 3
  { id:"museum", minDiff:3, text:"Clara visited a museum. They saw seven paintings, three sculptures, and one ancient map. Clara's favourite was the map.", mode:"question",
    question:"What was Clara's favourite thing?", choices:["A painting","A sculpture","An ancient map"], answer:2 },

  { id:"storm", minDiff:3, text:"Before the storm, Ben closed all the windows, brought the garden furniture inside, and called his neighbour to warn her.", mode:"both",
    scenes:[{emoji:"🪟✅",label:"Closing windows"},{emoji:"🪑🏠",label:"Moving furniture"},{emoji:"📞👩",label:"Calling neighbour"}],
    question:"What did Ben do last before the storm?", choices:["Closed the windows","Called his neighbour","Turned off the lights"], answer:1 },

  { id:"recipe", minDiff:3, text:"The recipe needed two eggs, a cup of flour, half a cup of sugar, and a pinch of salt. Sam accidentally added two cups of sugar instead.", mode:"question",
    question:"How much sugar did Sam accidentally add?", choices:["Half a cup","One cup","Two cups"], answer:2 },

  // diff 4
  { id:"expedition", minDiff:4, text:"The explorers left base camp at dawn, crossed a river, climbed a rocky hill, and reached the hidden valley by noon. They found an old stone wall.", mode:"both",
    scenes:[{emoji:"🌅🏕️",label:"Leaving base camp"},{emoji:"🌊🚶",label:"Crossing the river"},{emoji:"⛰️🧗",label:"Climbing the hill"},{emoji:"🏞️🗿",label:"Reaching the valley"}],
    question:"What did the explorers find in the hidden valley?", choices:["A treasure chest","An old stone wall","A waterfall"], answer:1 },

  { id:"detective", minDiff:4, text:"Detective Rivera noticed three clues: a muddy boot print, a broken window, and a red scarf near the door. She decided the scarf was most important.", mode:"question",
    question:"Which clue did Detective Rivera think was most important?", choices:["The muddy boot print","The broken window","The red scarf"], answer:2 },

  // diff 5
  { id:"ancient_city", minDiff:5, text:"Archaeologists discovered an ancient city buried under sand dunes. They found tools, pottery, and bones of twelve different animal species. The pottery suggested the city was over two thousand years old.", mode:"question",
    question:"How many different animal species' bones were found?", choices:["Ten","Twelve","Twenty"], answer:1 },

  { id:"shipwreck", minDiff:5, text:"The ship set sail in calm weather, encountered a fierce storm three days in, lost its main mast, and limped into port after seven days at sea.", mode:"order",
    scenes:[{emoji:"⛵☀️",label:"Setting sail calmly"},{emoji:"⛵🌩️",label:"Hitting the storm"},{emoji:"⛵💥",label:"Losing the mast"},{emoji:"⛵🏘️",label:"Arriving in port"}] },

  { id:"hospital", minDiff:5, text:"Dr. Patel treated eight patients, performed two small procedures, supervised three junior doctors, and still found time to write a report before lunch.", mode:"question",
    question:"How many junior doctors did Dr. Patel supervise?", choices:["Two","Three","Eight"], answer:1 }
];

let _lastStoryId = null;
function pickStory(diff) {
  const pool = STORY_LIBRARY.filter(s => diff >= s.minDiff);
  const candidates = pool.length > 1 ? pool.filter(s => s.id !== _lastStoryId) : pool;
  const story = candidates[Math.floor(Math.random() * candidates.length)];
  _lastStoryId = story.id;
  return story;
}

function pickSubMode(story, diff) {
  if (story.mode !== "both") return story.mode;
  // Lower difficulty → lean ordering; higher → lean questions
  return Math.random() < (diff >= 3 ? 0.65 : 0.35) ? "question" : "order";
}