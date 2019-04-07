/**
 * @file  : ng-component-outlet.directive.ts
 * License: MIT/X11
 * @author: Dries Pauwels <2mjolk@gmail.com>
 * Date   : ma 28 jan 2019 23:51
 */

import {
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Injector,
  Input,
  NgModuleFactory,
  NgModuleRef,
  OnChanges,
  OnDestroy,
  DoCheck,
  SimpleChanges,
  Type,
  ViewContainerRef,
  KeyValueChangeRecord,
  KeyValueDiffer,
  KeyValueDiffers,
  KeyValueChanges,
  ChangeDetectorRef
} from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Instantiates a single {@link Component} type and inserts its Host View into current View.
 * `NgComponentOutlet` provides a declarative approach for dynamic component creation.
 *
 * `NgComponentOutlet` requires a component type, if a falsy value is set the view will clear and
 * any existing component will get destroyed.
 *
 * ### Fine tune control
 *
 * You can control the component creation process by using the following optional attributes:
 *
 * * `ngComponentOutletInjector`: Optional custom {@link Injector} that will be used as parent for
 * the Component. Defaults to the injector of the current view container.
 *
 * * `ngComponentOutletContent`: Optional list of projectable nodes to insert into the content
 * section of the component, if exists.
 *
 * * `ngComponentOutletNgModuleFactory`: Optional module factory to allow dynamically loading other
 * module, then load a component from that module.
 *
 * ### Syntax
 *
 * Simple
 * ```
 * <ng-container *ngComponentOutlet="componentTypeExpression"></ng-container>
 * ```
 *
 * Customized injector/content
 * ```
 * <ng-container *ngComponentOutlet="componentTypeExpression;
 *                                   injector: injectorExpression;
 *                                   content: contentNodesExpression;">
 * </ng-container>
 * ```
 *
 * Customized ngModuleFactory
 * ```
 * <ng-container *ngComponentOutlet="componentTypeExpression;
 *                                   ngModuleFactory: moduleFactory;">
 * </ng-container>
 * ```
 * ## Example
 *
 * {@example common/ngComponentOutlet/ts/module.ts region='SimpleExample'}
 *
 * A more complete example with additional options:
 *
 * {@example common/ngComponentOutlet/ts/module.ts region='CompleteExample'}

 * A more complete example with ngModuleFactory:
 *
 * {@example common/ngComponentOutlet/ts/module.ts region='NgModuleFactoryExample'}
 *
 * @experimental
 */
@Directive({selector: '[ngComponentOutlet]'})
export class NgComponentOutlet implements OnChanges, OnDestroy, DoCheck {
  @Input() ngComponentOutlet: Type<any>;
  @Input() ngComponentOutletInjector: Injector;
  @Input() ngComponentOutletContent: any[][];
  @Input() ngComponentOutletNgModuleFactory: NgModuleFactory<any>;
  @Input() set ngComponentOutletInput(inputs:{[key: string]: any}){
    this._inputs = inputs;
    if(!this._inputDiffer && inputs){
      this._inputDiffer = this._differs.find(inputs).create();
    }
  }
  @Input() set ngComponentOutletOutput(outputs:{[key: string]: any}){
    this._outputs = outputs;
    if(!this._outputDiffer && outputs) {
      this._outputDiffer = this._differs.find(outputs).create();
    }
  }

  private _inputs:{[key:string]: any} = {};
  private _outputs:{[key:string]: any} = {};
  private _componentRef: ComponentRef<any>|null = null;
  private _moduleRef: NgModuleRef<any>|null = null;
  private _componentFactory: ComponentFactory<any>|null = null;
  private _unsubscribe$ = new Subject();
  private _inputDiffer:KeyValueDiffer<string, any>;
  private _outputDiffer:KeyValueDiffer<string, Function>;

  constructor(private _viewContainerRef: ViewContainerRef,
    private _differs:KeyValueDiffers) {}

  ngDoCheck() {
    let inputChanges;
    let outputChanges;
    if(this._inputDiffer){
      inputChanges = this._inputDiffer.diff(this._inputs);
      if(inputChanges) {
        this._updateIO(inputChanges, (key:string, value:any) =>
          this._componentRef.instance[key] = value);
      }
    }

    if(this._outputDiffer){
      outputChanges = this._outputDiffer.diff(this._outputs);
      if(outputChanges){
        this._updateIO(outputChanges, (key:string, value:Function) =>
          this._componentRef.instance[key].pipe(
            takeUntil(this._unsubscribe$)).subscribe(value)
        );
      }
    }

    if(outputChanges || inputChanges){
      this._componentRef.injector.get(ChangeDetectorRef).markForCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._hasOnlyIOChanges(changes)) {
      return;
    }

    this._updateComponent(changes);
  }

  private _updateComponent(changes: SimpleChanges) {
    this._viewContainerRef.clear();
    this._componentRef = null;

    if (this.ngComponentOutlet) {
      const elInjector = this.ngComponentOutletInjector || this._viewContainerRef.parentInjector;

      if (changes['ngComponentOutletNgModuleFactory']) {
        if (this._moduleRef) this._moduleRef.destroy();

        if (this.ngComponentOutletNgModuleFactory) {
          const parentModule = elInjector.get(NgModuleRef);
          this._moduleRef = this.ngComponentOutletNgModuleFactory.create(parentModule.injector);
        } else {
          this._moduleRef = null;
        }
      }

      const componentFactoryResolver = this._moduleRef ? this._moduleRef.componentFactoryResolver :
        elInjector.get(ComponentFactoryResolver);

      this._componentFactory =
        componentFactoryResolver.resolveComponentFactory(this.ngComponentOutlet);

      this._componentRef = this._viewContainerRef.createComponent(
        this._componentFactory !, this._viewContainerRef.length, elInjector,
        this.ngComponentOutletContent);
    }
  }

  private _hasOnlyIOChanges(changes: SimpleChanges) {
    const bindings = new Set(['ngComponentOutletInput', 'ngComponentOutletOutput']);
    return Object.keys(changes).every(change => bindings.has(change));
  }

  private _updateIO(changes:KeyValueChanges<string, any>, setter:Function) {
    changes.forEachRemovedItem((r:KeyValueChangeRecord<string, any>)=> setter(r.key, null));
    changes.forEachAddedItem((r:KeyValueChangeRecord<string, any>)=> setter(r.key, r.currentValue))
    changes.forEachChangedItem((r:KeyValueChangeRecord<string, any>)=> setter(r.key, r.currentValue))
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
    if (this._moduleRef) this._moduleRef.destroy();
  }
}
