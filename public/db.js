const request = window.indexedDB.open("budgetTracker", 1);

let db;

// triggers if cache version change is detected
request.onupgradeneeded = ({ target }) => {
  const db = target.result;
  const objectStore = db.createObjectStore("budgetTracker", {
    autoIncrement: true,
  });
  // objectStore.createIndex("itemIndex", "item");
};

// if online, upload cached transactions
request.onsuccess = ({ target }) => {
  db = target.result;
  if (navigator.onLine) {
    uploadTransaction();
  }
};

// on error
request.error = ({ target }) => {
  console.log(target.error);
};

function saveRecord(record) {
  // create a transaction to the object store
  const transaction = db.transaction(["budgetTracker"], "readwrite");
  // access the object store using the transaction created above
  const transactionStore = transaction.objectStore("budgetTracker");
  // add transaction to object store
  transactionStore.add(record);
}

function uploadTransaction() {
  // create a transaction to the object store
  const transaction = db.transaction(["budgetTracker"], "readwrite");
  // access the object store
  const transactionStore = transaction.objectStore("budgetTracker");
  // get all cached transactions in the object store
  const cachedTransactions = transactionStore.getAll();

  // if there are transactions, send them to the server
  cachedTransactions.onsuccess = () => {
    if (cachedTransactions.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(cachedTransactions.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          // create transaction to the object store
          const transaction = db.transaction(["budgetTracker"], "readwrite");
          // access the new_transaction object store
          const transactionStore = transaction.objectStore("budgetTracker");
          // clear all items in your store
          transactionStore.clear();

          alert("Cached transactions submitted");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// when app comes back online, execute uploadTransaction function
window.addEventListener("online", uploadTransaction);
