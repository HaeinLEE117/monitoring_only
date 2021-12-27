const id = prompt('enter your id');
const password = prompt('enter your password');

class UserStorage {
    loginUser(id, password, onSuccess, onError) {
        setTimeout(() => {
            if (id == 'lee' && password == 'dream' ||
                id == 'code' && password == '1234'
            ) {
                onSuccess(id);
            } else {
                onError(new Error('not found'));
            }
        }, 2000);
    }
    getRoles(user, onSuccess, onError) {
        setTimeout(() => {
            if (user === 'lee') {
                onSuccess({ name: 'lee', role: 'admin' });
            } else {
                onError(new Error('no access'))
            }
        }, 1000);
    }
}

const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
        if (id == 'lee' && password == 'dream' ||
            id == 'code' && password == '1234'
        ) {
            resolve(id);
        } else {
            reject(new Error('role not found'));
        }
    }, 2000);
});

promise.then((value) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (value === 'lee') {
                resolve({ name: 'lee', role: 'admin' });
            } else {
                reject(new Error('no access'))
            }
        }, 1000);
    })
})
    .catch(error => {
        console.log(error);
        return { name: value, role: 'unkown' }
    })
    .then((user) => { console.log(`user name: ${user.name} user role: ${user.role}`) }
    )
    .catch(error => { console.log(error) })
    .finally(() => { console.log("excution is endcode") })
    ;

// id, pass 받아서 
//로그인
//로그인한 id를 통해 roles 요청
//user object 출력


