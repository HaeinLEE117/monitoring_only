

// Promise is an Object for asynchromous operation. (1) State (2) Producer - Consumer
// State : pending(operating) -> fulfilled or rejected
// Producer vs Consumer 


// 1. Producer
// when new Promise is created, the executor runs automatically.
const promise = new Promise((resolve,reject)=>{
    //heavy works
    console.log('doing something..');
    setTimeout(()=>{
        resolve('lee');
        //reject(new Error('no network'));
    },2000);
});


//2. Consumers : then, atch, finally

promise.then((value)=>{
    console.log(value);
}
)
.catch(error=>{
    console.log(error)
})
.finally(()=>{
    console.log('finally end')
});

//3. Promise chaining
const fetchNumber = new Promise((resolve,reject)=>{
    setTimeout(()=>resolve(1),1000);
});

fetchNumber
.then(num => num *2)
.then(num => num *3)
.then(num => {
    return new Promise((resolve,reject)=>{
        setTimeout(()=>resolve(num-1),1000);

    });
}).then(num=>console.log(num));
