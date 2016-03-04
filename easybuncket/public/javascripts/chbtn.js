/**
 * Created by lwf60 on 2016/1/30.
 */
window.onload=function displayTime(){
    var d=new Date();
    document.getElementById('time').innerHTML=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
}
function changeYear(){
    document.getElementById('InName').innerHTML='年收入';
    document.getElementById('CoName').innerHTML='年消费';
}
function changeWeek(){
    document.getElementById('InName').innerHTML= '周收入';
    document.getElementById('CoName').innerHTML='周消费';
}
function changeMonth(){
    document.getElementById('InName').innerHTML= '月收入';
    document.getElementById('CoName').innerHTML= '月消费';
}