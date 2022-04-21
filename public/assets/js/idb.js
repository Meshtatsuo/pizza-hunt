// create var to hold db connection
let db;

// establish connection to IndexedsDB database called 'pizza_hunt' and set it to version 1

const request = indexedDB.open('pizza_hunt', 1);

request.onupgradeneeded = function(event) {
    // save reference to database
    const db = event.target.result;
    // create an object store (table) called `new_pizza`   , set it to have an auto incrementing primary key
    db.createObjectStore('new_pizza', {autoIncrement: true });
}

// upon successful
request.onsuccess = function(event) {
    // when db is created set it to db
    db = event.target.result;

    // check if app is online, if yes run uploadPizza() function to send all local db data to api
    if (navigator.onLine) {
        uploadPizza();
    }
};

request.onerror = function(event){
    console.log(event.target.errorCode);
}

// will be executed if we attempt to submit a new pizza without internet
function saveRecord(record) {
    // open new transaction with database (read and write perms)
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access object store for `new_pizza`
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // add record to your store with add method
    pizzaObjectStore.add(record);
}

function uploadPizza() {
    // open a transaction on your db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // get all records from store and ste to variable
    const getAll = pizzaObjectStore.getAll();
    // upon successful .getAll(), run this
    getAll.onsuccess = function() {
        // if there was data, let's send it to the api server
        if(getAll.result.length > 0) {
            fetch('/api/pizzas', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'

                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['new_pizza'], 'readwrite');
                //access the new_pizza object store
                const pizzaObjectStore = transaction.objectStore('new_pizza');
                //clear all items in store
                pizzaObjectStore.clear();

                alert('All saved pizza has been submitted!');
            })
            .catch(err=> {
                console.log(err);
            })
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadPizza);