<span style="font-family: 'Comic Sans MS', 'Comic Sans', Arial">

## ✨ MettyNeo Userscripts ✨

<p>Sometimes small things on Neopets annoy me so I write userscripts to make things a bit easier and share them to the world to hopefully make everyone's life a bit easier.</p>

<i><small>\* Script unofficially approved on /r/neopets! <span style="color:grey">(Very few scripts are approved because their userscript approval process is an absolute mess)</span></small></i>
<i><small>\* NOTE: /r/neopets script approval has been revoked due to a false ban I'm currently under in the community. For now my posts are deleted there and I'm unsure when or if they'll be back. Sorry for any inconvenience!</span></small></i>
</small>

___


### Page Overhauls:

<small>

* ⚔️ [Battledome Set Selector / Better Battledome ](Neopets%20-%20Battledome%20Set%20Selector.user.js) \*
	* Adds the ability to save and select up to 5 BD weapon/ability selections with the click of a button!
	* Sets can be set to automatically apply based on the current turn!
	* Disables the BD animations, making fights much more seamless!
	* Remembers pet / challenger selections and allows you to filter only favorited challengers!
	* Tracks and displays earnings and lets you copy your prizes to clipboard to share with others!
	* Tracks Obelisk contribution, including battles played and points earned for your team!
	* <u>Note:</u> Script automatically disables during 2P battles and after your first 10 Obelisk battles!

* 🎣 [Active Pet Switch / Fishing Vortex Plus](Neopets%20-%20Active%20Pet%20Switch.user.js) \*
	* Allows you to switch your active pet from anywhere with the press of a button!
	* Adds additional features for the Fishing Vortex such as level display and time since last fished!
		- Now you can fish with <i>all</i> of your pets!
	

* 🎴 [Better, Faster Godori](Neopets%20-%20Better%20Faster%20Godori.user.js)
	* Removes the unnecessary delay between actions, making the game way faster!
	* Cards in hand will automatically be assigned the relevant stack, reducing number of clicks!
	* You can play the highest value card in your hand by clicking on a card stack on the table!
	* A complete overhaul of the game's visual display!
		- Cards are color-coded by capture set
		- Hand is sorted by card type
		- Hovering over a card highlights cards of the same capture type
		- Displays number of cards in hand, deck and capture categories
	* Adds a timer so you can really race to those 250 hand wins!
	* <span style="color:grey">[UNIMPLEMENTED] Tracks cards in play and displays card counts to help make better decisions!</span>
	
* 🥤 [NeoCola Enhancements](Neopets%20-%20NeoCola%20Enhancements.user.js)
	* Cleans up and vastly improves the token selection UI!
	* Tracks prize results, displaying your average earnings and cumulative odds for a Transmogrification Potion!
	* Implements the ["Legal Cheat" Easter Egg](https://web.archive.org/web/20210619183531/https://old.reddit.com/r/neopets/comments/o3mq8r/neocola_tokens/) to increase Neopoint earnings!
		- <u>NOTE:</u> The legality of this is a grey area and it is currently enabled by default. This can be easily disabled in the script's configs - use at your own discretion!
	* Overhauls token submission to allow for quick submissions to still be displayed and tracked!
		- [WIP] Submission and tracking works but no additional displays are added yet

* 📦 [Inventory +](Neopets%20-%20Inventory%2B.user.js)
	* Allows you to perform multiple actions in an inventory without refreshing the page!
		- <span style="color:grey"><u>NOTE:</u> Certain prompts, eg gifting users, may not auto-refresh at the right time. This will be fixed in a later version.</span>
	* Remembers your option selection for each item, making repeated uses much quicker!
	
___


### QoL Scripts:
* ☠️ [Lever of Doom Shame Tracker](Neopets%20-%20LoD%20Shame%20Tracker.user.js)
	- Tracks the number of times the lever has been pulled and the amount of NP spent
	- Automatically checks to see if you have earned the avatar, allowing for spam-refreshing without worries!
	
* 🛒 [Quick Inventory Deposit](Neopets%20-%20Quick%20Inventory%20Deposit.user.js)
	* Adds a button on all pages that deposits all items currently in your inventory into your Safety Deposit Box
		- Donates items using the quick stock page in batches of 70
		
* ⭐ [Home Page Redirect](Neopets%20-%20Home%20Page%20Redirect.user.js) \*
	- Simply redirects from the new homepage to the actual game site's home page.
	
* 🏳️‍🌈 [Trans Affirming Neopets](Neopets%20-%20Trans%20Affirming%20Neopets.user.js) <i>[(+ Userscript Compat)](Neopets%20-%20Trans%20Affirming%20Neopets%20(Compat).user.js)</i>
	- Lets the user replace all instances of a word with another word on all Neopets pages
	- Primarily intended for replacing deadnames but can be used for any word or phrase!
	- Userscript Compat applies the word replace after everything loads, thus replacing content added directly after the page itself loads.
	- <u>Note:</u> Requires the user to add pairs of words in the script itself!
	- <u>Note:</u> Does not currently replace instances of words added to the page after loading, eg. on pop-up prompts!
	
* 🍗 [NeoFoodClub +](Neopets%20-%20NeoFoodClub%2B.user.js) \*
	- Adds various small improvements to the fansite [NeoFood.Club](https://neofood.club/)
		+ Automatically applies max bet amount
		+ Keeps track of bets that have been placed to prevent double-betting
		+ Opens bet placement links in a new tab and automatically closes them once applied
		+ Adds quicklinks to the Current Bets and Collect Winnings pages
		
* 🖼 [Mystery Pic Helper](Neopets%20-%20Mystery%20Pic%20Helper.user.js)
	- Adds quicklinks to Jellyneo Image Emporium pages to help users determine the Mystery Pic

___

### WIP Userscripts:

* 📡 [Direct Link Display](Neopets%20-%20Direct%20Link%20Display.user.js)
	- Adds a visual display to daily direct links
	- Currently supports Qasalan Expellibox and Coconut Shy
	- Wheel support planned

* 🗃 [SDB Inventarium](Neopets%20-%20SDB%20Inventarium.user.js)
	- Currently only tracks items in SDB and items going in/out of SDB
		+ <u>NOTE:</u> Currently does not track items deposited via the Quick Inventory Deposit userscript
	- <span style="color:grey">[UNIMPLEMENTED] Overhauls the SDB by displaying all items on one page
	- <span style="color:grey">[UNIMPLEMENTED] Items can be sorted by rarity, est. price, market price, quantity, and more!</span>
		+ Currently allows users to sort for r102-r179 items for Faerie Festival, albeit with a primitive display
	- <span style="color:grey">[UNIMPLEMENTED] User can save sorting options and quickly apply saved search conditions!
