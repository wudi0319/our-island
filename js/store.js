// Storage adapter. Next step: swap LocalStore for a SupabaseStore with the same
// interface (load / save / subscribe) so both partners share one island.
const LocalStore={
  key:'our-island-v2',
  clearOld(){try{localStorage.removeItem('our-island-v1')}catch(e){}},
  load(){try{return JSON.parse(localStorage.getItem(this.key))}catch(e){return null}},
  save(state){localStorage.setItem(this.key,JSON.stringify(state))},
  subscribe(cb){window.addEventListener('storage',e=>{if(e.key===this.key)cb(this.load())})}
};
window.Store=LocalStore;window.LocalStore=LocalStore;
