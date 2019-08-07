let survey =
{
 "title": "Demographic Survey",
 "description": "Demographic Survey Example",
 "pages": [
  {
   "name": "Step 1",
   "elements": [
    {
     "type": "dropdown",
     "name": "Age",
     "choices": [
      {
       "value": "item1",
       "text": "18-22 years old"
      },
      {
       "value": "item2",
       "text": "23-26 years old"
      },
      {
       "value": "item3",
       "text": "27-30 years old"
      }
     ]
    },
    {
     "type": "radiogroup",
     "name": "question1",
     "title": "Gender",
     "choices": [
      "Male",
      "Female"
     ]
    }
   ]
  },
  {
   "name": "Step 2",
   "elements": [
    {
     "type": "panel",
     "name": "Employment",
     "elements": [
      {
       "type": "checkbox",
       "name": " Employment Status",
       "choices": [
        "Full-time",
        "Part-time",
        "Unemployed",
        "Self-employed",
        "Retired",
        "Student"
       ]
      },
      {
       "type": "rating",
       "name": "Income",
       "rateMin": 1000,
       "rateMax": 30000,
       "rateStep": 1000
      }
     ]
    }
   ]
  }
 ]
}
//---------------------------------
let results = [
{
    "Age": "item2",
    "question1": "Male",
    " Employment Status": [
        "Part-time",
        "Self-employed"
    ],
    "Income": 2000
},
{
    "Age": "item2",
    "question1": "Female",
    " Employment Status": [
        "Self-employed"
    ],
    "Income": 20000
}
,
{
    "Age": "item3",
    "question1": "Female",
    " Employment Status": [
        "Retired",
        "Self-employed"
    ],
    "Income": 3000
},
{
    "Age": "item3",
    "question1": "Female",
    "Income": 7000
}
]