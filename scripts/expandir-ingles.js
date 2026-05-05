import {
    readFileSync,
    writeFileSync
} from 'fs';

const canciones = JSON.parse(readFileSync('src/data/clasicos.json', 'utf-8'));

// Paso 1: Mover las post-2000 de "Clasicos/Ingles" a "Rock/Pop Ingles"
canciones.forEach(c => {
    if (c.genero === 'Clasicos/Ingles' && c.year >= 2000) {
        c.genero = 'Rock/Pop Ingles';
    }
});

// Paso 2: Nuevas canciones Clasicos/Ingles (1970-1999) - completar hasta 150
const nuevosClasicos = [{
        titulo: "Smoke on the Water",
        artista: "Deep Purple",
        year: 1972
    },
    {
        titulo: "Highway Star",
        artista: "Deep Purple",
        year: 1972
    },
    {
        titulo: "Black Sabbath",
        artista: "Black Sabbath",
        year: 1970
    },
    {
        titulo: "Paranoid",
        artista: "Black Sabbath",
        year: 1970
    },
    {
        titulo: "Iron Man",
        artista: "Black Sabbath",
        year: 1970
    },
    {
        titulo: "Whole Lotta Love",
        artista: "Led Zeppelin",
        year: 1969
    },
    {
        titulo: "Kashmir",
        artista: "Led Zeppelin",
        year: 1975
    },
    {
        titulo: "Rock and Roll",
        artista: "Led Zeppelin",
        year: 1971
    },
    {
        titulo: "Immigrant Song",
        artista: "Led Zeppelin",
        year: 1970
    },
    {
        titulo: "Layla",
        artista: "Eric Clapton",
        year: 1970
    },
    {
        titulo: "Wonderful Tonight",
        artista: "Eric Clapton",
        year: 1977
    },
    {
        titulo: "Tears in Heaven",
        artista: "Eric Clapton",
        year: 1992
    },
    {
        titulo: "Free Bird",
        artista: "Lynyrd Skynyrd",
        year: 1973
    },
    {
        titulo: "Sweet Home Alabama",
        artista: "Lynyrd Skynyrd",
        year: 1974
    },
    {
        titulo: "Dream On",
        artista: "Aerosmith",
        year: 1973
    },
    {
        titulo: "Walk This Way",
        artista: "Aerosmith",
        year: 1975
    },
    {
        titulo: "Crazy",
        artista: "Aerosmith",
        year: 1993
    },
    {
        titulo: "More Than a Feeling",
        artista: "Boston",
        year: 1976
    },
    {
        titulo: "Carry On Wayward Son",
        artista: "Kansas",
        year: 1976
    },
    {
        titulo: "Dust in the Wind",
        artista: "Kansas",
        year: 1977
    },
    {
        titulo: "Barracuda",
        artista: "Heart",
        year: 1977
    },
    {
        titulo: "Alone",
        artista: "Heart",
        year: 1987
    },
    {
        titulo: "Livin' on a Prayer",
        artista: "Bon Jovi",
        year: 1986
    },
    {
        titulo: "You Give Love a Bad Name",
        artista: "Bon Jovi",
        year: 1986
    },
    {
        titulo: "Here I Go Again",
        artista: "Whitesnake",
        year: 1987
    },
    {
        titulo: "Pour Some Sugar on Me",
        artista: "Def Leppard",
        year: 1987
    },
    {
        titulo: "Panama",
        artista: "Van Halen",
        year: 1984
    },
    {
        titulo: "Jump",
        artista: "Van Halen",
        year: 1984
    },
    {
        titulo: "You Shook Me All Night Long",
        artista: "AC/DC",
        year: 1980
    },
    {
        titulo: "T.N.T.",
        artista: "AC/DC",
        year: 1975
    },
    {
        titulo: "The Final Countdown",
        artista: "Europe",
        year: 1986
    },
    {
        titulo: "Total Eclipse of the Heart",
        artista: "Bonnie Tyler",
        year: 1983
    },
    {
        titulo: "I Love Rock 'n' Roll",
        artista: "Joan Jett",
        year: 1981
    },
    {
        titulo: "We're Not Gonna Take It",
        artista: "Twisted Sister",
        year: 1984
    },
    {
        titulo: "Livin' La Vida Loca",
        artista: "Ricky Martin",
        year: 1999
    },
    {
        titulo: "Every Rose Has Its Thorn",
        artista: "Poison",
        year: 1988
    },
    {
        titulo: "Don't You (Forget About Me)",
        artista: "Simple Minds",
        year: 1985
    },
    {
        titulo: "Under Pressure",
        artista: "Queen & David Bowie",
        year: 1981
    },
    {
        titulo: "Heroes",
        artista: "David Bowie",
        year: 1977
    },
    {
        titulo: "Space Oddity",
        artista: "David Bowie",
        year: 1969
    },
    {
        titulo: "Let's Dance",
        artista: "David Bowie",
        year: 1983
    },
    {
        titulo: "Ziggy Stardust",
        artista: "David Bowie",
        year: 1972
    },
    {
        titulo: "Born to Run",
        artista: "Bruce Springsteen",
        year: 1975
    },
    {
        titulo: "Dancing in the Dark",
        artista: "Bruce Springsteen",
        year: 1984
    },
    {
        titulo: "Hungry Like the Wolf",
        artista: "Duran Duran",
        year: 1982
    },
    {
        titulo: "Rio",
        artista: "Duran Duran",
        year: 1982
    },
    {
        titulo: "Take My Breath Away",
        artista: "Berlin",
        year: 1986
    },
    {
        titulo: "Footloose",
        artista: "Kenny Loggins",
        year: 1984
    },
    {
        titulo: "Danger Zone",
        artista: "Kenny Loggins",
        year: 1986
    },
    {
        titulo: "Maniac",
        artista: "Michael Sembello",
        year: 1983
    },
    {
        titulo: "Flashdance... What a Feeling",
        artista: "Irene Cara",
        year: 1983
    },
    {
        titulo: "Girls Just Want to Have Fun",
        artista: "Cyndi Lauper",
        year: 1983
    },
    {
        titulo: "Time After Time",
        artista: "Cyndi Lauper",
        year: 1984
    },
    {
        titulo: "I Wanna Dance with Somebody",
        artista: "Whitney Houston",
        year: 1987
    },
    {
        titulo: "Greatest Love of All",
        artista: "Whitney Houston",
        year: 1986
    },
    {
        titulo: "Like a Virgin",
        artista: "Madonna",
        year: 1984
    },
    {
        titulo: "Papa Don't Preach",
        artista: "Madonna",
        year: 1986
    },
    {
        titulo: "Billie Jean",
        artista: "Michael Jackson",
        year: 1982
    },
    {
        titulo: "Man in the Mirror",
        artista: "Michael Jackson",
        year: 1988
    },
    {
        titulo: "Black or White",
        artista: "Michael Jackson",
        year: 1991
    },
    {
        titulo: "Careless Whisper",
        artista: "George Michael",
        year: 1984
    },
    {
        titulo: "Faith",
        artista: "George Michael",
        year: 1987
    },
    {
        titulo: "Wake Me Up Before You Go-Go",
        artista: "Wham!",
        year: 1984
    },
    {
        titulo: "Karma Chameleon",
        artista: "Culture Club",
        year: 1983
    },
    {
        titulo: "Tainted Love",
        artista: "Soft Cell",
        year: 1981
    },
    {
        titulo: "West End Girls",
        artista: "Pet Shop Boys",
        year: 1985
    },
    {
        titulo: "Shout",
        artista: "Tears for Fears",
        year: 1985
    },
    {
        titulo: "Head Over Heels",
        artista: "Tears for Fears",
        year: 1985
    },
    {
        titulo: "Love Will Tear Us Apart",
        artista: "Joy Division",
        year: 1980
    },
    {
        titulo: "Just Like Heaven",
        artista: "The Cure",
        year: 1987
    },
    {
        titulo: "Friday I'm in Love",
        artista: "The Cure",
        year: 1992
    },
    {
        titulo: "Lovesong",
        artista: "The Cure",
        year: 1989
    },
    {
        titulo: "Bizarre Love Triangle",
        artista: "New Order",
        year: 1986
    },
    {
        titulo: "There Is a Light That Never Goes Out",
        artista: "The Smiths",
        year: 1986
    },
    {
        titulo: "How Soon Is Now?",
        artista: "The Smiths",
        year: 1985
    },
    {
        titulo: "Where the Streets Have No Name",
        artista: "U2",
        year: 1987
    },
    {
        titulo: "Sunday Bloody Sunday",
        artista: "U2",
        year: 1983
    },
    {
        titulo: "Alive",
        artista: "Pearl Jam",
        year: 1991
    },
    {
        titulo: "Black",
        artista: "Pearl Jam",
        year: 1991
    },
    {
        titulo: "Jeremy",
        artista: "Pearl Jam",
        year: 1991
    },
    {
        titulo: "Black Hole Sun",
        artista: "Soundgarden",
        year: 1994
    },
    {
        titulo: "Man in the Box",
        artista: "Alice in Chains",
        year: 1990
    },
    {
        titulo: "Rooster",
        artista: "Alice in Chains",
        year: 1992
    },
    {
        titulo: "Plush",
        artista: "Stone Temple Pilots",
        year: 1992
    },
    {
        titulo: "1979",
        artista: "The Smashing Pumpkins",
        year: 1995
    },
    {
        titulo: "Today",
        artista: "The Smashing Pumpkins",
        year: 1993
    },
    {
        titulo: "Bullet with Butterfly Wings",
        artista: "The Smashing Pumpkins",
        year: 1995
    },
    {
        titulo: "Basket Case",
        artista: "Green Day",
        year: 1994
    },
    {
        titulo: "When I Come Around",
        artista: "Green Day",
        year: 1994
    },
    {
        titulo: "Self Esteem",
        artista: "The Offspring",
        year: 1994
    },
    {
        titulo: "Bittersweet Symphony",
        artista: "The Verve",
        year: 1997
    },
    {
        titulo: "Champagne Supernova",
        artista: "Oasis",
        year: 1996
    },
    {
        titulo: "Don't Look Back in Anger",
        artista: "Oasis",
        year: 1996
    },
    {
        titulo: "Song 2",
        artista: "Blur",
        year: 1997
    },
    {
        titulo: "No Rain",
        artista: "Blind Melon",
        year: 1992
    },
    {
        titulo: "Iris",
        artista: "Goo Goo Dolls",
        year: 1998
    },
    {
        titulo: "Closing Time",
        artista: "Semisonic",
        year: 1998
    },
    {
        titulo: "MMMBop",
        artista: "Hanson",
        year: 1997
    },
    {
        titulo: "Wannabe",
        artista: "Spice Girls",
        year: 1996
    },
    {
        titulo: "...Baby One More Time",
        artista: "Britney Spears",
        year: 1999
    },
    {
        titulo: "No Scrubs",
        artista: "TLC",
        year: 1999
    },
    {
        titulo: "Waterfalls",
        artista: "TLC",
        year: 1995
    },
    {
        titulo: "Killing Me Softly",
        artista: "Fugees",
        year: 1996
    },
    {
        titulo: "Gangsta's Paradise",
        artista: "Coolio",
        year: 1995
    },
    {
        titulo: "Jump Around",
        artista: "House of Pain",
        year: 1992
    },
    {
        titulo: "Nuthin' but a 'G' Thang",
        artista: "Dr. Dre",
        year: 1992
    },
    {
        titulo: "California Love",
        artista: "2Pac",
        year: 1996
    },
    {
        titulo: "Juicy",
        artista: "The Notorious B.I.G.",
        year: 1994
    },
    {
        titulo: "Lose Yourself",
        artista: "Eminem",
        year: 1999
    },
];

// Paso 3: Nuevas canciones Rock/Pop Ingles (2000+) - completar hasta 150
const nuevosModernos = [{
        titulo: "Crazy in Love",
        artista: "Beyonce",
        year: 2003
    },
    {
        titulo: "Halo",
        artista: "Beyonce",
        year: 2008
    },
    {
        titulo: "Irreplaceable",
        artista: "Beyonce",
        year: 2006
    },
    {
        titulo: "Toxic",
        artista: "Britney Spears",
        year: 2004
    },
    {
        titulo: "Since U Been Gone",
        artista: "Kelly Clarkson",
        year: 2004
    },
    {
        titulo: "Stronger",
        artista: "Kelly Clarkson",
        year: 2011
    },
    {
        titulo: "Complicated",
        artista: "Avril Lavigne",
        year: 2002
    },
    {
        titulo: "Sk8er Boi",
        artista: "Avril Lavigne",
        year: 2002
    },
    {
        titulo: "Beautiful Day",
        artista: "U2",
        year: 2000
    },
    {
        titulo: "In the End",
        artista: "Linkin Park",
        year: 2001
    },
    {
        titulo: "Numb",
        artista: "Linkin Park",
        year: 2003
    },
    {
        titulo: "Crawling",
        artista: "Linkin Park",
        year: 2001
    },
    {
        titulo: "Somewhere I Belong",
        artista: "Linkin Park",
        year: 2003
    },
    {
        titulo: "Boulevard of Broken Dreams",
        artista: "Green Day",
        year: 2004
    },
    {
        titulo: "American Idiot",
        artista: "Green Day",
        year: 2004
    },
    {
        titulo: "Holiday",
        artista: "Green Day",
        year: 2004
    },
    {
        titulo: "How You Remind Me",
        artista: "Nickelback",
        year: 2001
    },
    {
        titulo: "Rockstar",
        artista: "Nickelback",
        year: 2005
    },
    {
        titulo: "The Reason",
        artista: "Hoobastank",
        year: 2003
    },
    {
        titulo: "Bring Me to Life",
        artista: "Evanescence",
        year: 2003
    },
    {
        titulo: "My Immortal",
        artista: "Evanescence",
        year: 2003
    },
    {
        titulo: "Chop Suey!",
        artista: "System of a Down",
        year: 2001
    },
    {
        titulo: "Toxicity",
        artista: "System of a Down",
        year: 2001
    },
    {
        titulo: "B.Y.O.B.",
        artista: "System of a Down",
        year: 2005
    },
    {
        titulo: "The Pretender",
        artista: "Foo Fighters",
        year: 2007
    },
    {
        titulo: "Everlong",
        artista: "Foo Fighters",
        year: 2000
    },
    {
        titulo: "Best of You",
        artista: "Foo Fighters",
        year: 2005
    },
    {
        titulo: "Learn to Fly",
        artista: "Foo Fighters",
        year: 2000
    },
    {
        titulo: "Clint Eastwood",
        artista: "Gorillaz",
        year: 2001
    },
    {
        titulo: "Last Resort",
        artista: "Papa Roach",
        year: 2000
    },
    {
        titulo: "Bodies",
        artista: "Drowning Pool",
        year: 2001
    },
    {
        titulo: "Somewhere Only We Know",
        artista: "Keane",
        year: 2004
    },
    {
        titulo: "How to Save a Life",
        artista: "The Fray",
        year: 2005
    },
    {
        titulo: "Hey Ya!",
        artista: "OutKast",
        year: 2003
    },
    {
        titulo: "Crazy",
        artista: "Gnarls Barkley",
        year: 2006
    },
    {
        titulo: "Rehab",
        artista: "Amy Winehouse",
        year: 2006
    },
    {
        titulo: "Back to Black",
        artista: "Amy Winehouse",
        year: 2006
    },
    {
        titulo: "Valerie",
        artista: "Amy Winehouse",
        year: 2007
    },
    {
        titulo: "Sex on Fire",
        artista: "Kings of Leon",
        year: 2008
    },
    {
        titulo: "Decode",
        artista: "Paramore",
        year: 2008
    },
    {
        titulo: "Misery Business",
        artista: "Paramore",
        year: 2007
    },
    {
        titulo: "Poker Face",
        artista: "Lady Gaga",
        year: 2008
    },
    {
        titulo: "Just Dance",
        artista: "Lady Gaga",
        year: 2008
    },
    {
        titulo: "Born This Way",
        artista: "Lady Gaga",
        year: 2011
    },
    {
        titulo: "Firework",
        artista: "Katy Perry",
        year: 2010
    },
    {
        titulo: "Roar",
        artista: "Katy Perry",
        year: 2013
    },
    {
        titulo: "Teenage Dream",
        artista: "Katy Perry",
        year: 2010
    },
    {
        titulo: "Hot N Cold",
        artista: "Katy Perry",
        year: 2008
    },
    {
        titulo: "Wrecking Ball",
        artista: "Miley Cyrus",
        year: 2013
    },
    {
        titulo: "Flowers",
        artista: "Miley Cyrus",
        year: 2023
    },
    {
        titulo: "Party in the U.S.A.",
        artista: "Miley Cyrus",
        year: 2009
    },
    {
        titulo: "Umbrella",
        artista: "Rihanna",
        year: 2007
    },
    {
        titulo: "Diamonds",
        artista: "Rihanna",
        year: 2012
    },
    {
        titulo: "We Found Love",
        artista: "Rihanna",
        year: 2011
    },
    {
        titulo: "Don't Stop the Music",
        artista: "Rihanna",
        year: 2007
    },
    {
        titulo: "Stay",
        artista: "Rihanna",
        year: 2013
    },
    {
        titulo: "Uptown Funk",
        artista: "Bruno Mars",
        year: 2014
    },
    {
        titulo: "Locked Out of Heaven",
        artista: "Bruno Mars",
        year: 2012
    },
    {
        titulo: "Grenade",
        artista: "Bruno Mars",
        year: 2010
    },
    {
        titulo: "That's What I Like",
        artista: "Bruno Mars",
        year: 2017
    },
    {
        titulo: "Rolling in the Deep",
        artista: "Adele",
        year: 2011
    },
    {
        titulo: "Set Fire to the Rain",
        artista: "Adele",
        year: 2011
    },
    {
        titulo: "Easy on Me",
        artista: "Adele",
        year: 2021
    },
    {
        titulo: "Counting Stars",
        artista: "OneRepublic",
        year: 2013
    },
    {
        titulo: "Apologize",
        artista: "OneRepublic",
        year: 2007
    },
    {
        titulo: "Radioactive",
        artista: "Imagine Dragons",
        year: 2012
    },
    {
        titulo: "Believer",
        artista: "Imagine Dragons",
        year: 2017
    },
    {
        titulo: "Demons",
        artista: "Imagine Dragons",
        year: 2013
    },
    {
        titulo: "Thunder",
        artista: "Imagine Dragons",
        year: 2017
    },
    {
        titulo: "Stitches",
        artista: "Shawn Mendes",
        year: 2015
    },
    {
        titulo: "Señorita",
        artista: "Shawn Mendes & Camila Cabello",
        year: 2019
    },
    {
        titulo: "Shape of You",
        artista: "Ed Sheeran",
        year: 2017
    },
    {
        titulo: "Perfect",
        artista: "Ed Sheeran",
        year: 2017
    },
    {
        titulo: "Photograph",
        artista: "Ed Sheeran",
        year: 2014
    },
    {
        titulo: "Castle on the Hill",
        artista: "Ed Sheeran",
        year: 2017
    },
    {
        titulo: "Happy",
        artista: "Pharrell Williams",
        year: 2013
    },
    {
        titulo: "Get Lucky",
        artista: "Daft Punk",
        year: 2013
    },
    {
        titulo: "Blinding Lights",
        artista: "The Weeknd",
        year: 2020
    },
    {
        titulo: "Starboy",
        artista: "The Weeknd",
        year: 2016
    },
    {
        titulo: "Save Your Tears",
        artista: "The Weeknd",
        year: 2020
    },
    {
        titulo: "Can't Feel My Face",
        artista: "The Weeknd",
        year: 2015
    },
    {
        titulo: "Havana",
        artista: "Camila Cabello",
        year: 2017
    },
    {
        titulo: "Old Town Road",
        artista: "Lil Nas X",
        year: 2019
    },
    {
        titulo: "Shallow",
        artista: "Lady Gaga & Bradley Cooper",
        year: 2018
    },
    {
        titulo: "Bohemian Like You",
        artista: "The Dandy Warhols",
        year: 2000
    },
    {
        titulo: "Seven Nation Army",
        artista: "The White Stripes",
        year: 2003
    },
    {
        titulo: "Feel Good Inc",
        artista: "Gorillaz",
        year: 2005
    },
    {
        titulo: "Somebody That I Used to Know",
        artista: "Gotye",
        year: 2011
    },
    {
        titulo: "Pumped Up Kicks",
        artista: "Foster the People",
        year: 2011
    },
    {
        titulo: "Chasing Cars",
        artista: "Snow Patrol",
        year: 2006
    },
    {
        titulo: "Take Me to Church",
        artista: "Hozier",
        year: 2013
    },
    {
        titulo: "Royals",
        artista: "Lorde",
        year: 2013
    },
    {
        titulo: "Somebody That I Used to Know",
        artista: "Gotye",
        year: 2011
    },
    {
        titulo: "Wake Me Up",
        artista: "Avicii",
        year: 2013
    },
    {
        titulo: "Levels",
        artista: "Avicii",
        year: 2011
    },
    {
        titulo: "Titanium",
        artista: "David Guetta ft. Sia",
        year: 2011
    },
    {
        titulo: "Chandelier",
        artista: "Sia",
        year: 2014
    },
    {
        titulo: "Cheap Thrills",
        artista: "Sia",
        year: 2016
    },
    {
        titulo: "Lean On",
        artista: "Major Lazer & DJ Snake",
        year: 2015
    },
    {
        titulo: "Rather Be",
        artista: "Clean Bandit",
        year: 2014
    },
    {
        titulo: "Riptide",
        artista: "Vance Joy",
        year: 2013
    },
    {
        titulo: "Ho Hey",
        artista: "The Lumineers",
        year: 2012
    },
    {
        titulo: "Little Talks",
        artista: "Of Monsters and Men",
        year: 2012
    },
    {
        titulo: "Stressed Out",
        artista: "Twenty One Pilots",
        year: 2015
    },
    {
        titulo: "Heathens",
        artista: "Twenty One Pilots",
        year: 2016
    },
    {
        titulo: "Ride",
        artista: "Twenty One Pilots",
        year: 2015
    },
    {
        titulo: "Attention",
        artista: "Charlie Puth",
        year: 2017
    },
    {
        titulo: "See You Again",
        artista: "Wiz Khalifa ft. Charlie Puth",
        year: 2015
    },
    {
        titulo: "Love Yourself",
        artista: "Justin Bieber",
        year: 2015
    },
    {
        titulo: "Sorry",
        artista: "Justin Bieber",
        year: 2015
    },
    {
        titulo: "Baby",
        artista: "Justin Bieber",
        year: 2010
    },
    {
        titulo: "Peaches",
        artista: "Justin Bieber",
        year: 2021
    },
    {
        titulo: "Levitating",
        artista: "Dua Lipa",
        year: 2020
    },
    {
        titulo: "Don't Start Now",
        artista: "Dua Lipa",
        year: 2019
    },
    {
        titulo: "New Rules",
        artista: "Dua Lipa",
        year: 2017
    },
    {
        titulo: "Physical",
        artista: "Dua Lipa",
        year: 2020
    },
    {
        titulo: "bad guy",
        artista: "Billie Eilish",
        year: 2019
    },
    {
        titulo: "Lovely",
        artista: "Billie Eilish & Khalid",
        year: 2018
    },
    {
        titulo: "Everything I Wanted",
        artista: "Billie Eilish",
        year: 2019
    },
    {
        titulo: "drivers license",
        artista: "Olivia Rodrigo",
        year: 2021
    },
    {
        titulo: "good 4 u",
        artista: "Olivia Rodrigo",
        year: 2021
    },
    {
        titulo: "As It Was",
        artista: "Harry Styles",
        year: 2022
    },
    {
        titulo: "Watermelon Sugar",
        artista: "Harry Styles",
        year: 2020
    },
    {
        titulo: "Sign of the Times",
        artista: "Harry Styles",
        year: 2017
    },
    {
        titulo: "Anti-Hero",
        artista: "Taylor Swift",
        year: 2022
    },
    {
        titulo: "Shake It Off",
        artista: "Taylor Swift",
        year: 2014
    },
    {
        titulo: "Blank Space",
        artista: "Taylor Swift",
        year: 2014
    },
    {
        titulo: "Love Story",
        artista: "Taylor Swift",
        year: 2008
    },
    {
        titulo: "Cruel Summer",
        artista: "Taylor Swift",
        year: 2019
    },
];

// Filtrar duplicados contra lo que ya existe
function yaExiste(lista, titulo, artista) {
    return lista.some(c =>
        c.titulo.toLowerCase() === titulo.toLowerCase() &&
        c.artista.toLowerCase() === artista.toLowerCase()
    );
}

let agregadosClasicos = 0;
for (const c of nuevosClasicos) {
    if (!yaExiste(canciones, c.titulo, c.artista)) {
        canciones.push({
            ...c,
            genero: "Clasicos/Ingles"
        });
        agregadosClasicos++;
    }
}

let agregadosModernos = 0;
for (const c of nuevosModernos) {
    if (!yaExiste(canciones, c.titulo, c.artista)) {
        canciones.push({
            ...c,
            genero: "Rock/Pop Ingles"
        });
        agregadosModernos++;
    }
}

writeFileSync('src/data/clasicos.json', JSON.stringify(canciones, null, 2));

const totalClasicos = canciones.filter(c => c.genero === 'Clasicos/Ingles').length;
const totalModernos = canciones.filter(c => c.genero === 'Rock/Pop Ingles').length;

console.log(`Movidas a Rock/Pop Ingles: canciones post-2000 reclasificadas`);
console.log(`Clasicos/Ingles: ${agregadosClasicos} nuevas agregadas → total ${totalClasicos}`);
console.log(`Rock/Pop Ingles: ${agregadosModernos} nuevas agregadas → total ${totalModernos}`);
console.log(`\nTotal canciones en clasicos.json: ${canciones.length}`);
console.log(`\nAhora corre: node scripts/descargar-previews.js`);