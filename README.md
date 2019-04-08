## angular-dynamic-outlet
Angular2 Dynamic Component Outlet

##Usage:
`
<ng-container *ngComponentOutlet="MyComponent;
Input:{
  property1: componentProperty1,
  property2: componentProperty2
};
Output:{
  emitter1: componentFn1,
  emitter2: componentFn2
};">
`
##caveat
declare componentFn as arrow function otherwise 'this' will be undefined !!!!
eg: componentFn = (value) => {
 ...
}

instead of:

componentFn(value){} like you normally do.
