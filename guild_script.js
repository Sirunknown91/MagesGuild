/*
 * Mage's Guild (v1.0) by Sirunknown (/u/sirunknown91 on Reddit)
 * Thanks for looking at my code! Please keep in mind that I only took like, a single "Web and internet programming" course that mostly focus on html, css, and PHP and stuff so 
 * javscript is not exactly my strongest language.
 *
*/

//Frames per second
var FPS = 60;
//Ticks per second
var TICKS_PER = 10;

var version = 0.5

//Mana per second
var mana_per = 0.0;
//Mana count
var mana_count = 0.0;
//Total mana count
var total_mana_count = 0.0;
//Total mana this run
var total_mana_count_run = 0.0;
//Mana additive bonus
var mana_add_bonus = 1.0;
//Mana multiplicative bonus
var mana_mult_bonus = 1.0;


//Gold per second
var gold_per = 0.0;
//Gold count
var gold_count = 0.0;
//Total gold count
var total_gold_count = 0.0;
//Total gold this run
var total_gold_count_run = 0.0;
//Gold additive bonus
var gold_add_bonus = 1.0;
//Gold multiplicative bonus
var gold_mult_bonus = 1.0;

//stores all spells
var spells = [];

var curr_spell_index = 0;

var curr_spell;

//spell text as displayed on page
var curr_spell_text = "";

//spell specific variables
var manifest_gold_spell;
var manifest_gold_limit = 10;

var study_world_spell;

var reanimate_worker_spell
var reanimate_worker_cost_mult = 1.2;

//store members
var members = [];

//member specfiic variables
var apprentice_member;
var recruiter_member;
var scholar_member;
var builder_member;
var pyro_member;
var cloth_member;
var necro_member;
var merchant_member;
var geo_member;
var noble_member;
var archmage_member;
var hero_member;

//store upgrades
var upgrades = [];
var avail_upgrades = [];
var purchased_upgrades = [];

//input flags
var ctrlDown = false;

//Settings
var num_mode = 0; //0 is words/engineering, 1 is engineering, 2 is scientific 

//Alerts
var new_upgrade = false;

//Save file
var true_save_data

//HTML stuff

//Mana counter HTML object
var mana_counter;

//Gold counter HTML object
var gold_counter;

//Stats area
var stats_area;

//Available upgrades
var avail_upgrades_elem;

//Purchased upgrades
var purchased_upgrades_elem;

//upgrade button
var upgrades_menu_button;

//num mode setting
var num_mode_button;

//Intervals
var update_interval;

var check_interval;

var save_interval;

class Spell{
    constructor(name = "nothing",   description = "no desc",
                                    calcGoal = function()
                                    {return 1}, 
                                    onCustomCast = function()
                                    {
                                    console.log("No cast on: " + this.name);}) 
    {
        this.name = name;
        this.description = description;
        this.calcGoal = calcGoal;
        this.goal = calcGoal();
        this.cast_count = 0;
        this.onCustomCast = onCustomCast;
        this.unlocked = false;
    }

    //Sets HTML element that this spell is represented by in the spellbook
    setElement(element){
        this.element = element;
    }

    //updates element and its children with relevant informations
    updateElement(){
        //update cast counter
        this.element.children[3].innerHTML = "Times cast: " + fixedNumberText(this.cast_count);
        //update visual mana cost
        this.element.children[2].innerHTML = "Mana cost: " + fixedNumberText(this.goal);

        //update description (should only be used for reanaimate worker)
        this.element.children[1].innerHTML = this.description;

        this.element.hidden = !this.unlocked;
    }
    
    //Standardized stuff that should work when any spell is cast
    onCast(){
        this.onCustomCast();
        this.cast_count++;
        this.updates();
    }

    updates(){
        this.goal = this.calcGoal();
        this.updateElement();
    }
}

class Member{
    constructor(name = "nothing", description = "no desc", base_cost = 1.0, base_prod_per = 1.0, isMage = true){

        this.name = name;
        this.description = description;
        this.isMage = isMage;
        //base production per second (should never change)
        this.base_prod_per = base_prod_per;

        //actual production per second per member
        this.prod_per = base_prod_per;

        //total production of all owned members
        this.total_prod_per = 0.0;

        //base cost (should never change)
        this.base_cost = base_cost;

        this.cost = base_cost

        //number of members owned
        this.count = 0;

        //amount that member cost increases
        this.cost_scale = 1.1;

        //production additive bonus
        this.prod_add_bonus = 1.0;

        //production multiplicative bonus
        this.prod_mult_bonus = 1.0;

        //unlocked flag
        this.unlocked = false;
    }

    //Sets HTML element that this member is represented by in the member tab
    setElement(element){
        this.element = element;
    }

    updateElement(){
        //Update owned counter
        this.element.children[2].innerHTML = "Owned: " + fixedNumberText(this.count);

        //Update production counters
        let prod_type = "";
        if(this.isMage){
            prod_type = "Mana"
        }else{
            prod_type = "Gold"
        }

        this.element.children[3].innerHTML = prod_type + " prod. per member: " + fixedNumberText(this.prod_per, 1) + "/second";
        this.element.children[4].innerHTML = "Total " + prod_type + " production: " + fixedNumberText(this.total_prod_per, 1) + "/second";

        //Update buy button w/ cost
        let purchase_text = "";
        if(ctrlDown){
            //Calculating maximum purchasable of this object
            let max_count = Math.floor(Math.log((gold_count * (this.cost_scale - 1.0))/(this.base_cost * Math.pow(this.cost_scale, this.count)) + 1.0) / Math.log(this.cost_scale))
            if(max_count < 0){
                max_count = 0;
            }

            let max_cost = this.base_cost * (Math.pow(this.cost_scale, this.count) *(Math.pow(this.cost_scale, max_count) - 1.0) / (this.cost_scale - 1.0))
            
            purchase_text = "Click to purchase " + fixedNumberText(max_count) + " for <br>" + fixedNumberText(max_cost) + " Gold.";
        }else{
            purchase_text = "Click to purchase for <br>" + fixedNumberText(this.cost) + " Gold.";
        }
        this.element.children[5].innerHTML = purchase_text;

        this.element.hidden = !(this.unlocked);

    }

    buyMember(){
        this.count++;
        updateProdPer();
    }

    updateCost(){
        this.cost = this.base_cost * Math.pow(this.cost_scale, this.count);
    }

    updateProd(){
        this.prod_per = this.base_prod_per * this.prod_mult_bonus * this.prod_add_bonus;
        if(this.isMage){
            this.prod_per *= (mana_add_bonus * mana_mult_bonus);
        }else{
            this.prod_per *= (gold_add_bonus * gold_mult_bonus);
        }
        this.total_prod_per = this.prod_per * this.count;
    }

    updates(){
        this.updateCost();
        this.updateProd();
        this.updateElement();

    }
}

class Upgrade{
    constructor(name = "none", description = "no desc", id = -1, base_cost = 100,
                onCustomPurchase = function() {console.log("bought " + this.name)}, tryCustomUnlock = function() {console.log("unlocked: " + this.name);return true;}){
        this.name = name;
        this.description = description;

        this.id = id;

        this.base_cost = base_cost;
        this.cost = base_cost;


        this.onCustomPurchase = onCustomPurchase;
        this.tryCustomUnlock = tryCustomUnlock;
        this.unlocked = false;
        this.purchased = false;
    }

    //Sets HTML element that this upgrade is represented by in the upgrade tab
    setElement(element){
        this.element = element;
    }

    updateElement(){
        if(this.purchased){
            this.element.children[1].innerHTML = "Purchased";
            this.element.children[1].setAttribute("onclick", "");
            this.element.children[1].style.cursor = "default";
        }else{
            this.element.children[1].innerHTML = "Purchase for " + fixedNumberText(this.cost) + " Gold.";
            this.element.children[1].setAttribute("onclick", "attemptBuyUpgrade(" + this.id + ")");
        }

        this.element.children[2].description = this.description;
        
    }

    unlock(){
        createUpgradeElement(this);

        addUpgradeTo(this, avail_upgrades);

        updateUpgradesShop();

        this.unlocked = true;

    }

    tryUnlock(){
        if(this.tryCustomUnlock()){
            this.unlock();
            return true;
        }
        return false;
    }

    onPurchase(){
        if(!this.purchased)
            this.onCustomPurchase();

        //remove this upgrade from available upgrades
        let index = avail_upgrades.indexOf(this);
        if(index >= 0){
            avail_upgrades.splice(index, 1);
        }

        addUpgradeTo(this, purchased_upgrades);
        
        this.purchased = true;

        
        updateProdPer();
        updateUpgradesShop();
        this.updateElement();
        //hides description
        this.element.children[2].hidden = true;
    }

    
   
}

///////////
// START //
///////////

function Start(){
    //initializing variables
    mana_counter = document.getElementById("mana_counter");
    mana_counter_spell_text = document.getElementById("mana_counter_spell");
    gold_counter = document.getElementById("gold_counter");
    mana_per_counter = document.getElementById("mana_per_counter");
    gold_per_counter = document.getElementById("gold_per_counter");
    spellbook = document.getElementById("spellbook");
    members_tab = document.getElementById("members");

    menu_window = document.getElementById("menu_window");
    upgrades_menu_button = document.getElementById("upgrades_button");

    stats_area = document.getElementById("stats_area");

    avail_upgrades_elem = document.getElementById("avail_upgrades");
    purchased_upgrades_elem = document.getElementById("purchased_upgrades");

    num_mode_button = document.getElementById("num_mode_button");

    //creating members
    apprentice_member = new Member("Apprentice", "An inexperienced mage to learn and help.", 10, 1, true);
    recruiter_member = new Member("Recruiter", "A recruiter to draw more attention to your guild.", 50, 2, false);
    scholar_member = new Member("Scholar", "A more experienced mage, but still interesting in learning.", 500, 7, true);
    builder_member = new Member("Builder", "A helpful construction worker to expand your guild.", 2222, 20, false);
    pyro_member = new Member("Pyromancer", "A fire mage who promises they won't burn your guild down.", 45100, 72,true);
    cloth_member = new Member("Clothier", "A clothes maker who'll make some sweet matching robes.", 100000, 150, false);
    necro_member = new Member("Necromancer", "A mage of death. Spooky.", 333333, 333, true);
    merchant_member = new Member("Merchant", "A salesman to generate more income for your guild.", 707070, 700, false);
    geo_member = new Member("Geomancer", "A stoic mage of the earth, ready to shape the world to your will.", 2500000, 2500, true);
    noble_member = new Member("Noble", "An generous noble who's interested in spending some of their wealth for you.", 5000000, 5000, false);
    archmage_member = new Member("Archmage", "A master of all things magic. ", 12345678, 9876, true);
    hero_member = new Member("Hero", "An adventurous hero to rightfully earn some treasure for you.", 30000000, 30000, false);

    members[0] = apprentice_member;
    members[1] = recruiter_member;
    members[2] = scholar_member;
    members[3] = builder_member;
    members[4] = pyro_member;
    members[5] = cloth_member;
    members[6] = necro_member;
    members[7] = merchant_member;
    members[8] = geo_member;
    members[9] = noble_member;
    members[10] = archmage_member;
    members[11] = hero_member;

    //Adding members to html
    for(var i = 0; i < members.length; i++){
        members_tab.appendChild(createMemberElement(i));
    }

    //creating spells
    manifest_gold_spell = new Spell("Manifest Gold", "Manifests the mana spent to cast this as gold!", 
                                    calcGoalManifestGold, onCastManifestGold)
    study_world_spell = new Spell("Study World", "Use magic to gain a better understanding of the world around you, unlocking some upgrades.", 
                                    calcGoalStudyWorld, onCastStudyWorld);
    reanimate_worker_spell = new Spell("Reanimate Worker", "Resurrects the cheapest worker, spending mana equal to 120% of its gold cost. Ressing: None",
                                    calcGoalReanimateWorker, onCastReanimateWorker);
    
    spells[0] = new Spell("None (Storing mana)");
    spells[1] = manifest_gold_spell;
    spells[2] = study_world_spell;
    spells[3] = reanimate_worker_spell;

    //Adding spells to html
    for(var i = 1; i < spells.length; i++){
        spellbook.appendChild(createSpellElement(i));
        
    }

    //Adding stats to html
    createStatElements();
    updateStats();

    //creating upgrades

    upgrades = [];
    avail_upgrades = [];
    purchased_upgrades = [];

    //Don't change id of upgrades or it'll probably break saves

    /*ID ranges
        <10000: member specific upgrades
        10000s: manifest gold
        10100s: study world
    */

    /* Template for standard upgrades
    // upgrades
    addStandardUpgrade("", "Multiplies ~ > production by 2. <br><q><i></i></q>", 001, 0, member, 1);
    addStandardUpgrade("", "Multiplies ~ > production by 2. <br><q><i></i></q>", 002, 0, member, 10);
    */
    
    //Apprentice upgrades
    addStandardUpgrade("Magic Classes", "Multiplies Apprentice mana production by 2. <br><q><i>Maybe you should actually teach these kids something.</i></q>", 101, 100, apprentice_member, 1);
    addStandardUpgrade("Spell Practice", "Multiplies Apprentice mana production by 2. <q><i>P-R-A-C-T-I-C-E</i></q>", 102, 1000, apprentice_member, 25);

    //Recruiter upgrades
    addStandardUpgrade("Magic Signs", "Multiplies Recruiter gold production by 2. <q><i>Draws more attention.</i></q>", 201, 500, recruiter_member, 1);
    addStandardUpgrade("Loudspeaker", "Multiplies Recruiter gold production by 2. <q><i>Draws more attention. But, like, even more.</i></q>", 202, 5000, recruiter_member, 25);

    //Scholar upgrades
    addStandardUpgrade("Magic Glasses", "Multiplies Scholar mana production by 2. <q><i>Oh..... THAT'S what those black smudges are supposed to be!</i></q>", 301, 5000, scholar_member, 1);
    addStandardUpgrade("Library card", "Multiplies Scholar mana production by 2. <br><q><i>Gaining mana isn't hard when you've got a library card!</i></q>", 302, 50000, scholar_member, 25);

    //Builder upgrades
    addStandardUpgrade("Magic Hammers", "Multiplies Builder gold production by 2. <br><q><i>These should help the building process.</i></q>", 401, builder_member.base_cost * 10, builder_member, 1);
    addStandardUpgrade("Hard Hats", "Multiplies Builder gold production by 2. <q><i>Especially neccessary now that builders keep hitting each other with hammers.</i></q>", 402, builder_member.base_cost * 100, builder_member, 25);

    //Pyro upgrades
    addStandardUpgrade("Magic Book of Matches", "Multiplies Pyromancer mana production by 2. <br><q><i>You're pretty sure that matches are not magical, but your pyromancers want them anyway.</i></q>", 501, pyro_member.base_cost * 10, pyro_member, 1);
    addStandardUpgrade("Campfire", "Multiplies Pyromancer mana production by 2. <br><q><i>Your pyromancers say they have a relaxing song to sing for the campfire.</i></q>", 502, pyro_member.base_cost * 100, pyro_member, 25);

    //Cloth upgrades
    addStandardUpgrade("Magic Needles", "Multiplies Clothier gold production by 2. <br><q><i>Youch!</i></q>", 601, cloth_member.base_cost*10, cloth_member, 1);
    addStandardUpgrade("Haystack", "Multiplies Clothier gold production by 2. <br><q><i>To store the needles in, of course.</i></q>", 602, cloth_member.base_cost*100, cloth_member, 25);

    //Necro upgrades
    addStandardUpgrade("Magic skulls", "Multiplies Necromancer mana production by 2. <br><q><i>It's quite fun to dramatically hold one of these in your hand</i></q>", 701, necro_member.base_cost * 10, necro_member, 1);
    addStandardUpgrade("Mausoleum", "Multiplies Necromancer mana production by 2. <br><q><i>Like 90% of a necromancer's powers come from having a spooky environment.</i></q>", 702, necro_member.base_cost * 100, necro_member, 25);
    
    //Merchant upgrades
    addStandardUpgrade("Magic goods", "Multiplies Merchant gold production by 2. <br><q><i>Much better than those magic bads.</i></q>", 801, merchant_member.base_cost * 10, merchant_member, 1);
    addStandardUpgrade("Haggling", "Multiplies Merchant gold production by 2. <br><q><i>You sure wish you could haggle on these upgrade costs.</i></q>", 802, merchant_member.base_cost * 100, merchant_member, 25);

    //Geomancer upgrades
    addStandardUpgrade("Magic shovels", "Multiplies Geomancer mana production by 2. <br><q><i>Yes, moving dirt with enchant tools definetely counts as geomancy.</i></q>", 901, geo_member.base_cost * 10, geo_member, 1);
    addStandardUpgrade("Geography", "Multiplies Geomancer mana production by 2. <br><q><i>To shape the earth, you must first understand it.</i></q>", 902, geo_member.base_cost * 100, geo_member, 25);

    //Noble upgrades
    addStandardUpgrade("Magic castles", "Multiplies Noble gold production by 2. <br><q><i>Objectively harder to live in a magically shifting castle, but also objectively cooler!</i></q>", 1001, noble_member.base_cost * 10, noble_member, 1);
    addStandardUpgrade("Nepotism", "Multiplies Noble gold production by 2. <br><q><i>A noble's kids want to become mages. Sure... as long as you get paid from this deal.</i></q>", 1002, noble_member.base_cost * 100, noble_member, 25);

    //Archmage upgrades
    addStandardUpgrade("Magic magic", "Multiplies Archmage mana production by 2. <br><q><i>Yeah, we enchanted magic itself. Don't think about it too hard.</i></q>", 1101, archmage_member.base_cost * 10, archmage_member, 1);
    addStandardUpgrade("Mighty staves", "Multiplies Archmage mana production by 2. <br><q><i>Wands are for dweebs, real archmages use a STAFF.</i></q>", 1102, archmage_member.base_cost * 100, archmage_member, 25);

    //Hero upgrades
    addStandardUpgrade("Magic gear", "Multiplies Hero gold production by 2. <br><q><i>Monster killing just got a whole lot easier!</i></q>", 1201, hero_member.base_cost * 10, hero_member, 1);
    addStandardUpgrade("Quest helper", "Multiplies Hero gold production by 2. <br><q><i>Your heroes are so good at completing quests, its like they're reading exactly what to do in a guide or something.</i></q>", 1202, hero_member.base_cost * 100, hero_member, 25);

    //Manifest Goldupgrades
    addUpgradeTo(new Upgrade("More manifestation", "Multiplies the cost (and production) of Manifest Gold by 100.", 10001, 10000, function(){manifest_gold_limit *= 100; manifest_gold_spell.updates();}, function(){return mana_per >= 100;}))
    addUpgradeTo(new Upgrade("Even more manifestation", "Multiplies the cost (and production) of Manifest Gold by 100. <br><q><i>Again!</i></q>", 10002, 1000000, function(){manifest_gold_limit *= 100; manifest_gold_spell.updates();}, function(){return mana_per >= 10000;}))
    addUpgradeTo(new Upgrade("Manifestion escalation", "Multiplies the cost (and production) of Manifest Gold by 100. <br><q><i>Third time's the charm.</i></q>", 10003, 100000000, function(){manifest_gold_limit *= 100; manifest_gold_spell.updates();}, function(){return mana_per >= 1000000;}))


    //Study world Upgrades
    addStudyWorldUpgrade("Leyline mapping", "Multiplies all mana production by 1.1", 1);
    addStudyWorldUpgrade("New Memberships", "Multiplies production of Apprentices and Recruiters by 1.5", 2, function(){apprentice_member.prod_mult_bonus *= 1.5; recruiter_member.prod_mult_bonus *= 1.5});
    addStudyWorldUpgrade("Leyline mapping 2", "Multiplies all mana production by 1.1", 3);
    addStudyWorldUpgrade("Trade route mapping", "Multiplies all gold production by 1.1", 4, function(){increaseGoldMultBonus(1.1)});
    addStudyWorldUpgrade("Leyline mapping 3", "Multiplies all mana production by 1.1", 5);

    addStudyWorldUpgrade("Grand Library", "Multiplies Scholar production by 5", 6, function(){scholar_member.prod_mult_bonus *= 5});
    addStudyWorldUpgrade("Leyline mapping 4", "Multiplies all mana production by 1.1", 7);
    addStudyWorldUpgrade("Trade route mapping 2", "Multiplies all gold production by 1.1", 8, function(){increaseGoldMultBonus(1.1)});
    addStudyWorldUpgrade("Leyline mapping 5", "Multiplies all mana production by 1.1", 9);
    addStudyWorldUpgrade("Highest peak in the world", "Multiplies all mana production by 2.5 <br><q><i>The proximity of the stars makes mana flow even more.</i></q>", 10, function(){increaseManaMultBonus(2.5)});

    addStudyWorldUpgrade("Leyline mapping 6", "Multiplies all mana production by 1.1", 11);
    addStudyWorldUpgrade("Mass gravesite", "Multiplies Raise Worker spell cost by .95 <br><q><i>Probably the result of a plague or something..... On second thought maybe we shouldn't hang around here too long.</i></q>", 12, function(){reanimate_worker_cost_mult *= .95; reanimate_worker_spell.updates()});
    addStudyWorldUpgrade("Leyline mapping 7", "Multiplies all mana production by 1.1", 13);
    addStudyWorldUpgrade("Hills of gold", "Multiplies all gold production by 4", 14, function(){increaseGoldMultBonus(4)});
    addStudyWorldUpgrade("Rip in time", "Multiplies all production by 3 <br><q><i>Time flows differently here. Would make a neat tourist destination</i></q>", 15, function(){increaseBothMultBonus(3)});

    addStudyWorldUpgrade("Leyline mapping 8", "Multiplies all mana production by 1.1", 16);
    addStudyWorldUpgrade("Trade route mapping 3", "Multiplies all gold production by 1.1", 17, function(){increaseGoldMultBonus(1.1)});
    addStudyWorldUpgrade("Leyline mapping 9", "Multiplies all mana production by 1.1", 18);
    addStudyWorldUpgrade("Trade route mapping 4", "Multiplies all gold production by 1.1", 19, function(){increaseGoldMultBonus(1.1)});
    addStudyWorldUpgrade("Rip in time 2", "Multiplies all production by 5 <br><q><i>Your scholars tell you this is actually the same rip in time as the last one, merely existing in the same time, but different place. Neat.</i></q>", 20, function(){increaseBothMultBonus(5)});


    //fixing width of right menu buttons
    var menu_buttons = document.getElementsByClassName("menu_button");
    var mb_length = menu_buttons.length;
    var mb_width = (100/mb_length);
    for (var i = 0; i < menu_buttons.length; i++){
        menu_buttons[i].style.width = mb_width.toString() + "%";
        menu_buttons[i].style.left = (mb_width * i).toString() + "%";
    }

    //event listeners
    document.addEventListener('keydown', checkCtrl);
    document.addEventListener('keyup', checkCtrl);
    
    //Default values to display
    swapWindow(0);
    changeSpell(0);

    loadSave();

    save_interval = setInterval(writeSave, 60000);
}

///////////
// RESET //
///////////
//Resets for current "run". will make more sense once prestige is implemented
function Reset(){

    if(update_interval)
        clearInterval(update_interval);
    
    if(check_interval)
        clearInterval(check_interval);
    
    mana_per = 1.0;
    gold_per = 0.0;
    mana_mult_bonus = 1.0;
    mana_add_bonus = 1.0;
    gold_mult_bonus = 1.0;
    gold_add_bonus = 1.0;

    updateProdPer();

    mana_count = 0;
    gold_count = 0;
    total_mana_count_run = 0;
    total_gold_count_run = 0;

    for(let i = 0; i < members.length; i++){
        members[i].count = 0;
        members[i].cost_scale = 1.1;
        members[i].prod_add_bonus = 1.0;
        members[i].prod_mult_bonus = 1.0;
        members[i].unlocked = false;
        members[i].updates();
    }

    manifest_gold_limit = 10;
    reanimate_worker_cost_mult = 1.1;

    for(let i = 1; i < spells.length; i++){
        spells[i].cast_count = 0;
        spells[i].unlocked = false;
        spells[i].updates();
    }

    spells[1].unlocked = true;
    spells[1].updates();

    for(let i = 0; i < upgrades.length; i++){
        upgrades[i].unlocked = false;
        upgrades[i].purchased = false;
    }

    avail_upgrades = [];
    purchased_upgrades = [];

    new_upgrade = false;

    changeSpell(0);

    updateUpgradesShop();

    updateStats();

    updateProdPer();

    update_interval = setInterval(Update, 1000/TICKS_PER);

    checkUnlocks();
    check_interval = setInterval(checkUnlocks, 1000);

}

//Resets everything
function trueReset(){

    total_mana_count = 0;
    total_gold_count = 0;
    Reset();
}



////////////
// UPDATE //
////////////
//Called once per frame
function Update(){

    //Update values
    increaseMana(mana_per * 1/TICKS_PER);
    increaseGold(gold_per * 1/TICKS_PER);

    if(curr_spell_index > 0){
        //check spell related stuff
        curr_spell.goal = curr_spell.calcGoal();

        if(mana_count >= curr_spell.goal){
            mana_count -= curr_spell.goal;
            curr_spell.onCast();
            curr_spell.goal = curr_spell.calcGoal();
        }
    }
    
    //Update text of visible counters
    if(curr_spell_index == 0){
        mana_counter.innerHTML = fixedNumberText(mana_count);
    }else{
        mana_counter.innerHTML = fixedNumberText(mana_count) + " / " + 
                                fixedNumberText(curr_spell.goal);
    }
    gold_counter.innerHTML = fixedNumberText(gold_count);
    mana_per_counter.innerHTML = fixedNumberText(mana_per) + "/sec";
    gold_per_counter.innerHTML = fixedNumberText(gold_per) + "/sec";

}

//Called once every second for lighter load
function checkUnlocks(){

    //Unhides members
    for(let i = 0; i < members.length; i++){
        if(!members[i].unlocked && total_gold_count_run >= members[i].base_cost){
            members[i].unlocked = true;
            members[i].updates();
        }
    }

    //Unhides "Study world" spell
    if(study_world_spell.element.hidden && scholar_member.count >= 5){
        study_world_spell.unlocked = true;
        study_world_spell.updates();
    }

    if(reanimate_worker_spell.element.hidden && necro_member.count >= 5){
        reanimate_worker_spell.unlocked = true;
        reanimate_worker_spell.updates();
    }

    for(let i = 0; i < upgrades.length; i++){
        if(!upgrades[i].unlocked){
            if(upgrades[i].tryUnlock()){
                new_upgrade = true;
            }
        }       
    }

    //managing new upgrade alert
    if(new_upgrade && !menu_window.children[1].hidden){
        new_upgrade = false;
    }

    if(new_upgrade){
        upgrades_menu_button.style.color = "khaki";
    }else{
        upgrades_menu_button.style.color = "whitesmoke";
    }

    updateStats();
}

//General helper functions
function fixedNumberText(num, decimal = 0){

    start_num = num;

    if(decimal > 0){
        num *= Math.pow(10, decimal);
        num = Math.floor(num);
        num /= Math.pow(10, decimal);
    }

    num = Math.round(num);

    let end_text = "";

    if(num > 9999){
        let num_digits = Math.floor(Math.log10(num));
    
        let digits_mod_3 = (num_digits%3);
        let digits_div_3 = num_digits - digits_mod_3;

        num /= Math.pow(10, num_digits-2);
        num = Math.floor(num);

        if(num_mode == 0){
            //Words/engineering

            num /= Math.pow(10, 2-digits_mod_3);

            if(digits_div_3 == 3){
                end_text = "K";
            }else if(digits_div_3 == 6){
                end_text = "M";
            }else if(digits_div_3 == 9){
                end_text = "B";
            }else if (digits_div_3 == 12){
                end_text = "T";
            }else if (digits_div_3 == 15){
                end_text = "Qa";
            }else if (digits_div_3 == 18){
                end_text = "Qi";
            }else if (digits_div_3 >= 21){
                end_text = "e" + digits_div_3.toString();
            }
        }else if(num_mode == 1){
            //engineering
            num /= Math.pow(10, 2-digits_mod_3);

            end_text = "e" + digits_div_3.toString();
        }else if(num_mode == 2){
            //scientific
            num /= Math.pow(10, 2);

            end_text = "e" + num_digits.toString();
        }
        

        
    }


    
    let num_text = num.toString() + end_text;

    return num_text;
    
}

function removeHTMLChildren(elem){
    let child = elem.lastElementChild;

    while(child){

        elem.removeChild(child);

        child = elem.lastElementChild;
    }
}

//Less general functions
function addUpgradeTo(upgrade, upgrades_list = upgrades){

    if(upgrades_list == avail_upgrades){
        return addAvailUpgrade(upgrade);
    }

    if(upgrades_list.length == 0){
        upgrades_list.push(upgrade);
        return upgrade;
    }

    for(let i = 0; i < upgrades_list.length; i++){
        if(upgrades_list[i].id > upgrade.id){
            upgrades_list.splice(i, 0, upgrade);
            return upgrade;
        }
    }

    upgrades_list.push(upgrade);
    return upgrade;
}

function addAvailUpgrade(upgrade){
    if(avail_upgrades.length == 0){
        avail_upgrades.push(upgrade);
        return upgrade;
    }

    for(let i = 0; i < avail_upgrades.length; i++){
        if(avail_upgrades[i].cost > upgrade.cost){
            avail_upgrades.splice(i, 0, upgrade);
            return upgrade;
        }
    }

    avail_upgrades.push(upgrade);
    return upgrade;
}

function addStandardUpgrade(name, desc, id, cost, member, req, bonus = 2){

    // let stand_purch = function() {this.member.prod_mult_bonus *= this.bonus; this.member.updates()};
    // let stand_unlock = function() {if(this.member) return this.member.count >= req; else return false;};

    let stand_purch = function() {member.prod_mult_bonus *= bonus; member.updates()};
    let stand_unlock = function() {if(member) return member.count >= req; else return false;};

    return addUpgradeTo(new Upgrade(name, desc, id, cost, stand_purch, stand_unlock));
}

function addStudyWorldUpgrade(name, desc, num, on_purch = function(){increaseManaMultBonus(1.1)}){

    return addUpgradeTo(new Upgrade(name, desc, 10100 + num, 2000 * Math.pow(5, num), on_purch, function(){return study_world_spell.cast_count >= num}));
}

function increaseMana(m){
    mana_count += m;
    total_mana_count += m;
    total_mana_count_run += m;
}

function increaseGold(g){
    gold_count += g;
    total_gold_count += g;
    total_gold_count_run += g;
}

function increaseManaMultBonus(m){
    mana_mult_bonus *= m;
    updateProdPer();
}

function increaseManaAddBonus(m){
    mana_add_bonus += m;
    updateProdPer();
}

function increaseGoldMultBonus(g){
    gold_mult_bonus *= g;
    updateProdPer();
}

function increaseGoldAddBonus(g){
    gold_add_bonus += g;
    updateProdPer();
}

function increaseBothMultBonus(b){
    increaseGoldMultBonus(b);
    increaseManaMultBonus(b);
}


function updateProdPer(){
    //Calculating mana production
    temp_mana_per = 1.0 * mana_add_bonus * mana_mult_bonus;

    for(var i = 0; i < members.length; i++){
        if(members[i].isMage){
            members[i].updates();
            temp_mana_per += members[i].total_prod_per;
        }
    }

    mana_per = temp_mana_per;

    temp_gold_per = 0.0;

    for(var i = 0; i < members.length; i++){

        if(!members[i].isMage){
            members[i].updates();
            temp_gold_per += members[i].total_prod_per;
        }
        
    }

    gold_per = temp_gold_per;
}

function getPurchasedUpgrades(){

    let count = 0;

    for(let i = 0; i < upgrades.length; i++){
        if(upgrades[i].purchased){
            count++;
        }
    }
    return count;
}

function findUpgradeById(id){

    for(let i = 0; i < upgrades.length; i++){
        if(upgrades[i].id == id){
            return upgrades[i];
        }
    }

    return null;
}

//Debug Cheats
function unlockAllUpgrades(){
    console.log("Cheater!");
    for(let i = 0; i < upgrades.length; i++){
        upgrades[i].unlock();
    }
}

//Menu interactions
function swapWindow(j){

    for (let i = 0; i < menu_window.children.length; i++) {
        menu_window.children[i].hidden = true;

        if(i == j){
            menu_window.children[i].hidden = false;
        }
    }

}

function changeSpell(s){
    if(s >= spells.length){
        s = 0;
        console.error("Out of range of spells");
    }

    curr_spell_index = s;
    curr_spell = spells[s];

    for(var i = 1; i < spells.length; i++){
        if(i == s){
            spells[s].element.style.border = "solid 6px rgb(129, 0, 161)";
        }else{
            spells[i].element.style.border = "solid 3px rgb(41, 9, 49)";
        }
    }

    curr_spell_text = spells[s].name;
    mana_counter_spell_text.innerHTML = "Current spell: " + curr_spell_text;
}

function attemptBuyMember(m){
    if(m >= members.length){
        console.error("Out of range of members");
        return;
    }

    member = members[m];
    if(gold_count >= member.cost){
        do{
            gold_count -= member.cost;
            member.buyMember();
        }while(gold_count >= member.cost && ctrlDown);
        if(!reanimate_worker_spell.element.hidden){
            //Update reanimate spell
            reanimate_worker_spell.goal = reanimate_worker_spell.calcGoal();
            reanimate_worker_spell.updateElement();
        }

    }
    
}

function attemptBuyUpgrade(u){
    
    for(let i = 0; i < avail_upgrades.length; i++){
        check_upgrade = avail_upgrades[i];

        if(check_upgrade.id == u){
            if(gold_count >= check_upgrade.cost){
                gold_count -= check_upgrade.cost;
                check_upgrade.onPurchase();
                
            }
            return;
        }
    }

    console.log("did not find upgrade with id " + u);
}

function changeNumDisplay(mode = -1){
    if(mode <= -1){
        mode = num_mode + 1
        
    }

    num_mode = mode;
    if(num_mode >= 3){
        num_mode = 0;
    }

    if(num_mode == 0){
        num_mode_button.innerHTML = "Number display mode: Words";
    }else if(num_mode == 1){
        num_mode_button.innerHTML = "Number display mode: Engineering";
    }else if(num_mode == 2){
        num_mode_button.innerHTML = "Number display mode: Scientific";
    }
}
//Creating HTML elements
function createSpellElement(i, spell = spells[i]){
    const createSpell = document.createElement("div");

    //Main body
    createSpell.className = "spell";
    createSpell.setAttribute('onclick', 'changeSpell(' + i + ')');
    createSpell.hidden = true;

    //Name box
    const createSpellName = document.createElement("div");
    createSpellName.innerHTML = spell.name;
    createSpellName.className = "spell_name";
    createSpell.appendChild(createSpellName);

    //Description box
    const createSpellDesc = document.createElement("div");
    createSpellDesc.innerHTML = spell.description;
    createSpellDesc.className = "spell_desc";
    createSpell.appendChild(createSpellDesc);

    //Spell cost info box
    const createSpellCost = document.createElement("div");
    //createSpellCost.innerHTML = "Mana cost: " + fixedNumberText(spell.goal);
    createSpellCost.className = "spell_info";
    createSpell.appendChild(createSpellCost);

    //Cast count info box
    const createSpellCount = document.createElement("div");
    //createSpellCount.innerHTML = "Times cast: " + spell.cast_count;
    createSpellCount.className = "spell_info";
    createSpellCount.style.left = "10vw";
    createSpell.appendChild(createSpellCount);

    spell.setElement(createSpell);
    spell.updateElement();

    return createSpell;
}

function createMemberElement(i, member = members[i]){
    const createMember = document.createElement("div");

    //Main body
    createMember.className = "member"; 
    if(i % 2 == 1){
        createMember.style.left = "24.5vw";
    }else{
        createMember.style.left = "1vw";
    }

    top_spacing = 1 + (Math.floor(i/2) * 13);
    createMember.style.top = top_spacing.toString() + "vw";
    createMember.hidden = true;

    //Name box
    const createMemberName = document.createElement("div");
    createMemberName.innerHTML = member.name;
    createMemberName.className = "member_name";
    if(member.isMage){
        createMemberName.style.color = "rgb(172, 194, 255)";
    }else{
        createMemberName.style.color = "rgb(237, 255, 172)";
    }
    createMember.appendChild(createMemberName);

    //Description box
    const createMemberDesc = document.createElement("div");
    createMemberDesc.innerHTML = member.description;
    createMemberDesc.className = "member_desc";
    createMember.appendChild(createMemberDesc);

    //Owned count info box
    const createMemberCount = document.createElement("div");
    //createMemberCount.innerHTML = "Owned: 1000000";
    createMemberCount.className = "member_info";
    createMember.appendChild(createMemberCount);

    //Production per info box
    const createMemberProd = document.createElement("div");
    createMemberProd.className = "member_info";
    createMemberProd.style.height = "2.8vw";
    createMemberProd.style.top = "2.1vw";
    createMember.appendChild(createMemberProd);

    //Total production info
    const createMemberTotalProd = document.createElement("div");
    createMemberTotalProd.className = "member_info";
    createMemberTotalProd.style.height = "2.8vw";
    createMemberTotalProd.style.top = "5.1vw";
    createMember.appendChild(createMemberTotalProd);

    //Buy button/cost
    const createMemberBuy = document.createElement("div");
    createMemberBuy.className = "member_buy";
    createMemberBuy.innerHTML = "Click to purchase for 1000000000 Gold";
    createMemberBuy.setAttribute('onclick', 'attemptBuyMember(' + i + ')');

    createMember.appendChild(createMemberBuy);
    

    member.setElement(createMember);
    member.updateElement();

    return createMember;
}

function createStatElements(){
    for(let i = 0; i < 10; i++){
        createStat = document.createElement("div");
        createStat.className = "statistic";
        createStat.innerHTML = "";

        stats_area.appendChild(createStat);
    }
}

function createUpgradeElement(upgrade){
    createUpgrade = document.createElement("div");
    createUpgrade.className = "upgrade";
    createUpgrade.addEventListener("mouseover", showUpgradeDesc);
    createUpgrade.addEventListener("mouseout", hideUpgradeDesc);

    createUpgradeInfo = document.createElement("div");
    createUpgradeInfo.className = "upgrade_info";
    createUpgrade.appendChild(createUpgradeInfo);

    createUpgradeName = document.createElement("div");
    createUpgradeName.innerHTML = upgrade.name;
    createUpgradeInfo.appendChild(createUpgradeName);

    createUpgradeBuy = document.createElement("div");
    createUpgradeBuy.className = "upgrade_buy";
    createUpgradeBuy.innerHTML = "click to buy";
    createUpgrade.appendChild(createUpgradeBuy);

    createUpgradeDesc = document.createElement("div");
    createUpgradeDesc.className = "upgrade_desc";
    createUpgradeDesc.innerHTML = upgrade.description;
    createUpgradeDesc.hidden = true;
    createUpgrade.appendChild(createUpgradeDesc);

    upgrade.setElement(createUpgrade);
    upgrade.updateElement();

    return createUpgrade;
}

//Updating HTML
function updateStats(){
    stat_elements = stats_area.children;

    stat_elements[0].innerHTML = "Total mana ever produced: " + fixedNumberText(total_mana_count);
    stat_elements[0].style.color = "rgb(172, 194, 255)";
    stat_elements[1].innerHTML = "Total gold ever produced: " + fixedNumberText(total_gold_count);
    stat_elements[1].style.color = "rgb(237, 255, 172)";

    stat_elements[2].innerHTML = "Total mana produced this run: " + fixedNumberText(total_mana_count_run);
    stat_elements[2].style.color = "rgb(172, 194, 255)";
    stat_elements[3].innerHTML = "Total gold produced this run: " + fixedNumberText(total_gold_count_run);
    stat_elements[3].style.color = "rgb(237, 255, 172)";

    let members_count = 0;
    let mages_count = 0;
    let workers_count = 0;

    for(let i = 0; i < members.length; i++){
        members_count += members[i].count;
        if(members[i].isMage){
            mages_count += members[i].count;
        }else{
            workers_count += members[i].count;
        }
    }

    stat_elements[4].innerHTML = "Total members owned: " + fixedNumberText(members_count);
    stat_elements[5].innerHTML = "Total mages owned: " + fixedNumberText(mages_count);
    stat_elements[6].innerHTML = "Total workers owned: " + fixedNumberText(workers_count);

    stat_elements[7].innerHTML = "Upgrades purchased: " + getPurchasedUpgrades() + "/" + upgrades.length;

}

function updateUpgradesShop(){

    removeHTMLChildren(avail_upgrades_elem);

    for(let i = 0; i < avail_upgrades.length; i++){
        avail_upgrades_elem.appendChild(avail_upgrades[i].element);
    }

    removeHTMLChildren(purchased_upgrades_elem);

    for(let i = 0; i < purchased_upgrades.length; i++){
        purchased_upgrades_elem.appendChild(purchased_upgrades[i].element);
    }

    

    //Update height
    if(avail_upgrades_elem.children.length > 0){
        avail_upgrades_elem.style.height = ((Math.floor((avail_upgrades_elem.children.length-1) / 3) + 1) * 4.9).toString() + "vw";
    }else{
        avail_upgrades_elem.style.height = "1vw";
    }

    purchased_upgrades_elem.style.height = ((Math.floor((purchased_upgrades_elem.children.length-1) / 3) + 1) * 4.9).toString() + "vw";


}

//////////
// SAVE //
//////////

function writeSave(){

    let save_data = "";

    save_data += "~Ver|" + version;

    //Saving global mana related variables
    save_data += "~";
    save_data += "Mana";
    save_data += "|";
    save_data += mana_count.toString();
    save_data += "|";
    save_data += total_mana_count.toString();
    save_data += "|";
    save_data += total_mana_count_run.toString();

    //Saving global gold related variables
    save_data += "~";
    save_data += "Gold";
    save_data += "|";
    save_data += gold_count.toString();
    save_data += "|";
    save_data += total_gold_count.toString();
    save_data += "|";
    save_data += total_gold_count_run.toString();


    //Saving members
    for(let i = 0; i < members.length; i++){
        
        members[i].updates();
        save_data += "~";
        save_data += "M";
        save_data += "|";
        save_data += i;
        save_data += "|"
        save_data += members[i].count;
        save_data += "|"
        save_data += members[i].unlocked;

    }

    //Saving spells
    for(let i = 1; i < spells.length; i++){

        spells[i].updates()

        save_data += "~";
        save_data += "S";
        save_data += "|";
        save_data += i;
        save_data += "|";
        save_data += spells[i].cast_count;
        save_data += "|";
        save_data += spells[i].unlocked;   
    }

    //Saving upgrades
    for(let i = 0; i < upgrades.length;i++){
        save_data += "~";
        save_data += "U";
        save_data += "|";
        save_data += upgrades[i].id;
        save_data += "|";
        save_data += upgrades[i].unlocked;
        save_data += "|";
        save_data += upgrades[i].purchased;
    }

    //Saving one-off things
    save_data += "~";
    save_data += "Selected Spell";
    save_data += "|";
    save_data += curr_spell_index;

    save_data += "~";
    save_data += "Num Mode";
    save_data += "|";
    save_data += num_mode;

    console.log("Saved game");

    true_save_data = save_data;

    try{
        localStorage.setItem('guild_save', save_data);

    }catch(error){
        console.error("could not save to local storage: " + error);
    }


}

function loadSave(){
    trueReset();

    let save_data = localStorage.getItem('guild_save');

    if(save_data){
        //Splits into major sections by ~
        let save_bits = save_data.split('~');

        //Goes through each split bit
        for(let i = 0; i < save_bits.length; i++){
            bit = save_bits[i];

            if(bit != ""){
                //Splits into sub-bits by |
                sub_bits = bit.split('|');

                prime_sub_bit = sub_bits[0];

                if(prime_sub_bit == "Mana"){
                    mana_count = parseFloat(sub_bits[1]);
                    total_mana_count = parseFloat(sub_bits[2]);
                    total_mana_count_run = parseFloat(sub_bits[3]);
                }else if (prime_sub_bit == "Gold"){
                    gold_count = parseFloat(sub_bits[1]);
                    total_gold_count = parseFloat(sub_bits[2]);
                    total_gold_count_run = parseFloat(sub_bits[3]);
                }else if (prime_sub_bit == "M"){
                    let save_member = members[sub_bits[1]];

                    save_member.count = parseInt(sub_bits[2]);
                    save_member.unlocked = (sub_bits[3] === "true");

                    save_member.updates();
                }else if (prime_sub_bit == "S"){

                    save_spell = spells[sub_bits[1]];

                    save_spell.cast_count = parseInt(sub_bits[2]);
                    save_spell.unlocked = (sub_bits[3] === "true");

                    save_spell.updates();
                }else if (prime_sub_bit == "U"){

                    save_upgrade = findUpgradeById(sub_bits[1]);

                    let save_unlocked = (sub_bits[2] === "true");
                    let save_purchased = (sub_bits[3] === "true");

                    if(save_unlocked){
                        save_upgrade.unlock()
                    }

                    if(save_purchased){
                        save_upgrade.onPurchase()
                    }
                }else if (prime_sub_bit == "Selected Spell"){
                    changeSpell(parseInt(sub_bits[1]))
                }else if (prime_sub_bit == "Num Mode"){
                    changeNumDisplay(parseInt(sub_bits[1]))
                }

            }
        }
    }

    updateProdPer();
    updateUpgradesShop();
    
}


////////////
// EVENTS //
////////////

//triggers by event (mouseover)
function showUpgradeDesc(e){
    target_elem = e.target;

    //moves target elem up to upgrade parent
    while(target_elem.className != "upgrade"){
        target_elem = target_elem.parentNode;
        
        if(target_elem.className == ""){
            //if we run out of class names, we've gone too far
            return;
        }
    }

    //get description element
    desc_elem = target_elem.children[2];

    //moves description if necessary
    if(target_elem.offsetLeft > window.innerWidth/4){
        desc_elem.style.left = "-10.9vw";
        
    }else{
        desc_elem.style.left = "13.7vw";
        
    }
    

    desc_elem.hidden = false;
}

//triggers by event (mouseout)
function hideUpgradeDesc(e){
    target_elem = e.target;

    //moves target elem up to upgrade parent
    while(target_elem.className != "upgrade"){
        target_elem = target_elem.parentNode;
        
        if(target_elem.className == ""){
            //if we run out of class names, we've gone too far
            return;
        }
    }

    target_elem.children[2].hidden = true;
}

//triggers on any key press
function checkCtrl(e){
    ctrlDown = e.ctrlKey;
    for(let i  = 0; i < members.length; i++){
        if(!members[i].element.hidden)
            members[i].updateElement();
    }
}


//Functions for specific spells (do not use directly!)
function calcGoalManifestGold(){
    return manifest_gold_limit;
}

function onCastManifestGold(){
    increaseGold(manifest_gold_limit);
}

function calcGoalStudyWorld(){
    return 2000 * Math.pow(5, this.cast_count);
}

function onCastStudyWorld(){
    //Unlock upgrades
}

function calcGoalReanimateWorker(){
    target_member = findReanimateTarget();
    if(reanimate_worker_spell){
        reanimate_worker_spell.description = "Resurrects the cheapest worker, spending mana equal to " + fixedNumberText(reanimate_worker_cost_mult * 100) + "% of its gold cost. Rezzing: " + target_member.name + ".";
        
    }

    return target_member.cost * reanimate_worker_cost_mult;
}

function onCastReanimateWorker(){
    findReanimateTarget().buyMember();
}

function findReanimateTarget(){
    
    target_member = members[1];

    min_cost = members[1].cost;

    for(let i = 2; i < members.length; i++){
        if(members[i].cost < min_cost && !members[i].isMage){
            min_cost = members[i].cost;
            target_member = members[i];
        }
    }
    return target_member;
}

//Functions for upgrades
