
class UserStorage{
    loginUser(id,password,onSuccess,onError){
        setTimeout(()=>{
            if(id =='lee'&&password=='dream'||
            id =='code'&&password=='1234'
            ){
                onSuccess(id);
            }else{
                onError(new Error('not found'));
            }
        },2000);
    }
    getRoles(user, onSuccess, onError){
        setTimeout(()=>{
            if(user==='lee'){
                onSuccess({name:'lee', role:'admin'});
            }else{
                onError(new Error('no access'))
            }
        },1000);
    }
}

// id, pass 받아서 
//로그인
//로그인한 id를 통해 roles 요청
//user object 출력

const userStorage = new UserStorage();
const id = prompt('enter your id');
const password = prompt('enter your password');
userStorage.loginUser(id,password,(user)=>{
    userStorage.getRoles(user,userWithRole=>{
        alert(`Hello ${userWithRole.name}, you have a ${userWithRole.role} roll`);
    }
    ,err=>{console.log(error)})
}
,(error)=>{
    err => {console.log(error)}
})