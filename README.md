## angular-dynamic-outlet
Angular2 Dynamic Component Outlet

##Usage:
```
<ng-container *ngComponentOutlet="MyComponent;
Input:{
  property1: componentProperty1,
  property2: componentProperty2
};
Output:{
  emitter1: componentFn1,
  emitter2: componentFn2
};">
```
##caveat
declare componentFn as arrow function otherwise 'this' will be of type SafeSubscriber 
instead of your component.
eg: componentFn = (value) => {
 ...
}
instead of:
componentFn(value){}.
