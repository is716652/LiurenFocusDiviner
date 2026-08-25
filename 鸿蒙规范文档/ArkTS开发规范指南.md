# ArkTS 开发规范指南

## 概述
本文档总结了HarmonyOS ArkTS语言的核心规范和限制，帮助开发者在项目开发过程中避免常见的编译错误。

## 🚫 核心禁用规则

### 1. 类型系统限制

#### 禁止使用的类型
- `any` 类型：完全禁止使用
- `unknown` 类型：不允许使用
- 索引签名：`[key: string]: T` 语法禁止
- 对象字面量类型：`{ name: string, age: number }` 内联类型定义禁止

#### ❌ 错误示例
```typescript
// 禁止使用any
let data: any = { name: "test" };

// 禁止使用索引签名
interface User {
  [key: string]: string; // ❌ 错误
}

// 禁止内联对象字面量类型
function processUser(user: { name: string, age: number }) { // ❌ 错误
  // ...
}
```

#### ✅ 正确做法
```typescript
// 定义明确的接口
interface User {
  name: string;
  age: number;
}

let data: User = { name: "test", age: 25 };

function processUser(user: User) { // ✅ 正确
  // ...
}
```

### 2. 循环语句限制

#### 禁止的循环方式
- `for...in` 循环：用于对象遍历时禁止
- `for...of` 循环：用于对象遍历时禁止

#### ❌ 错误示例
```typescript
const obj = { a: 1, b: 2, c: 3 };

// 禁止用于对象
for (const key in obj) { // ❌ 错误
  console.log(key, obj[key]);
}

for (const value of obj) { // ❌ 错误
  console.log(value);
}
```

#### ✅ 正确做法
```typescript
const obj = { a: 1, b: 2, c: 3 };

// 使用传统循环遍历对象键
const keys = Object.keys(obj);
for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  console.log(key, obj[key as keyof typeof obj]);
}

// 数组可以使用for...of
const arr = [1, 2, 3];
for (const item of arr) { // ✅ 数组可以使用
  console.log(item);
}
```

### 3. 属性访问限制

#### 禁止动态索引访问
- `obj[key]` 语法禁止
- 必须使用明确的属性名或类型安全的访问方式

#### ❌ 错误示例
```typescript
const user = { name: "张三", age: 25 };
const propertyName = "name";

// 禁止动态索引访问
const value = user[propertyName]; // ❌ 错误
```

#### ✅ 正确做法
```typescript
interface User {
  name: string;
  age: number;
}

const user: User = { name: "张三", age: 25 };
const propertyName = "name";

// 使用switch语句或类型断言
let value: string | number;
switch (propertyName) {
  case "name":
    value = user.name;
    break;
  case "age":
    value = user.age;
    break;
  default:
    value = "";
}

// 或使用Map
const userMap = new Map<string, string | number>();
userMap.set("name", "张三");
userMap.set("age", 25);
const mapValue = userMap.get(propertyName);
```

### 4. 对象处理限制

#### 禁止未类型化的对象字面量
- 所有对象必须预先定义接口
- 不允许使用隐式类型推断的对象

#### ❌ 错误示例
```typescript
// 禁止未类型化的对象字面量
const config = {
  api: "https://api.example.com",
  timeout: 5000
}; // ❌ 错误

function createData() {
  return { id: 1, name: "test" }; // ❌ 错误
}
```

#### ✅ 正确做法
```typescript
// 定义接口
interface Config {
  api: string;
  timeout: number;
}

interface Data {
  id: number;
  name: string;
}

const config: Config = {
  api: "https://api.example.com",
  timeout: 5000
}; // ✅ 正确

function createData(): Data {
  return { id: 1, name: "test" }; // ✅ 正确
}
```

## 📝 推荐替代方案

### 1. 使用Map/Record替代动态对象

#### 传统对象方式（❌ 禁止）
```typescript
const dynamicData: { [key: string]: string } = {};
dynamicData["field1"] = "value1";
```

#### Map方式（✅ 推荐）
```typescript
const dynamicData = new Map<string, string>();
dynamicData.set("field1", "value1");
const value = dynamicData.get("field1");
```

#### Record方式（✅ 推荐）
```typescript
type StringRecord = Record<string, string>;
const data: StringRecord = {
  field1: "value1",
  field2: "value2"
};
```

### 2. 使用传统循环

#### ❌ 禁止方式
```typescript
const obj = { a: 1, b: 2 };
for (const key in obj) {
  console.log(obj[key]);
}
```

#### ✅ 推荐方式
```typescript
const obj = { a: 1, b: 2 };
const keys = Object.keys(obj);
for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  console.log(obj[key as keyof typeof obj]);
}
```

### 3. 明确接口定义

#### ❌ 内联类型（禁止）
```typescript
function process(data: { name: string, value: number }) {
  // ...
}
```

#### ✅ 预定义接口（推荐）
```typescript
interface DataItem {
  name: string;
  value: number;
}

function process(data: DataItem) {
  // ...
}
```

## 🚫 更多核心限制

### 5. 函数和方法限制

#### 禁止的语法特性
- 解构赋值：`const [a, b] = array;` 禁止
- 展开运算符：`const newArr = [...arr];` 禁止
- 可选链操作符：`obj?.property` 禁止
- 空值合并操作符：`value ?? defaultValue` 禁止

#### ❌ 错误示例
```typescript
// 解构赋值
const [name, age] = userData; // ❌ 错误

// 展开运算符
const combined = { ...obj1, ...obj2 }; // ❌ 错误
const newArray = [...oldArray, newItem]; // ❌ 错误

// 可选链
const value = obj?.prop?.subProp; // ❌ 错误

// 空值合并
const result = value ?? default; // ❌ 错误
```

#### ✅ 正确做法
```typescript
// 替代解构赋值
const name = userData[0];
const age = userData[1];

// 替代对象展开
const combined: CombinedType = {
  prop1: obj1.prop1,
  prop2: obj2.prop2
};

// 替代数组展开
const newArray: ItemType[] = [];
for (let i = 0; i < oldArray.length; i++) {
  newArray.push(oldArray[i]);
}
newArray.push(newItem);

// 替代可选链
let value: ValueType;
if (obj && obj.prop && obj.prop.subProp) {
  value = obj.prop.subProp;
}

// 替代空值合并
let result: ResultType;
if (value !== null && value !== undefined) {
  result = value;
} else {
  result = default;
}
```

### 6. 静态方法限制

#### 静态上下文中的this使用
- 静态方法中不能使用 `this` 访问实例属性
- 静态方法中调用其他静态方法必须使用 `ClassName.method()`

#### ❌ 错误示例
```typescript
class DataManager {
  private static data: string[] = [];
  
  static addItem(item: string): void {
    this.data.push(item); // ❌ 错误：静态方法中使用this
    this.processData(); // ❌ 错误
  }
  
  static processData(): void {
    // 处理逻辑
  }
}
```

#### ✅ 正确做法
```typescript
class DataManager {
  private static data: string[] = [];
  
  static addItem(item: string): void {
    DataManager.data.push(item); // ✅ 正确
    DataManager.processData(); // ✅ 正确
  }
  
  static processData(): void {
    // 处理逻辑
  }
  
  static getData(): string[] {
    return DataManager.data; // ✅ 正确
  }
}
```

### 7. 类型推断限制

#### 必须显式类型注解的场景
- 函数返回值类型
- 变量声明（特别是复杂类型）
- 类属性定义

#### ❌ 错误示例
```typescript
// 缺少返回类型注解
function createUser(name: string) { // ❌ 错误
  return { name: name, id: Math.random() };
}

// 复杂对象缺少类型
const user = { // ❌ 错误
  name: "张三",
  profile: {
    age: 25,
    email: "zhang@example.com"
  }
};
```

#### ✅ 正确做法
```typescript
interface User {
  name: string;
  id: number;
}

interface UserProfile {
  age: number;
  email: string;
}

interface CompleteUser {
  name: string;
  profile: UserProfile;
}

function createUser(name: string): User { // ✅ 正确
  return { name: name, id: Math.random() };
}

const user: CompleteUser = { // ✅ 正确
  name: "张三",
  profile: {
    age: 25,
    email: "zhang@example.com"
  }
};
```

## 🛠️ 实用技巧

### 1. 快速错误定位
- 根据编译错误代码快速识别问题类型
- 常见错误代码对应特定规范违反

### 2. 类型安全优先
- 优先使用类型安全的API和方法
- 避免类型断言，使用类型守卫

### 3. 清晰的接口层次
- 为所有数据结构定义明确的接口
- 使用接口继承构建类型层次

### 4. 枚举和联合类型
```typescript
// 使用枚举提高可读性
enum Status {
  Active = "active",
  Inactive = "inactive"
}

// 使用联合类型限制取值范围
type Theme = "light" | "dark" | "auto";
```

### 5. 工具类和辅助方法
```typescript
// 数组操作工具类
class ArrayUtils {
  static clone<T>(source: T[]): T[] {
    const result: T[] = [];
    for (let i = 0; i < source.length; i++) {
      result.push(source[i]);
    }
    return result;
  }
  
  static find<T>(items: T[], predicate: (item: T) => boolean): T | undefined {
    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i])) {
        return items[i];
      }
    }
    return undefined;
  }
}

// 对象操作工具类
class ObjectUtils {
  static merge<T>(target: T, source: Partial<T>): T {
    const result: T = { ...target };
    const keys = Object.keys(source) as (keyof T)[];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const sourceValue = source[key];
      if (sourceValue !== undefined) {
        result[key] = sourceValue;
      }
    }
    return result;
  }
}
```

## 🎯 常见场景解决方案

### 1. 动态属性访问

#### 场景：根据字符串键访问对象属性
```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

function getProperty(obj: User, key: string): string | number {
  switch (key) {
    case "name":
      return obj.name;
    case "age":
      return obj.age;
    case "email":
      return obj.email;
    default:
      throw new Error(`Unknown property: ${key}`);
  }
}
```

### 2. 数组对象处理

#### 场景：处理对象数组
```typescript
interface Item {
  id: number;
  name: string;
}

function findItem(items: Item[], id: number): Item | undefined {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      return items[i];
    }
  }
  return undefined;
}
```

### 3. 配置对象管理

#### 场景：应用配置管理
```typescript
interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
}

class ConfigManager {
  private static config: AppConfig = {
    apiUrl: "",
    timeout: 5000,
    retries: 3
  };

  static getConfig(): AppConfig {
    return ConfigManager.config;
  }

  static updateConfig(newConfig: Partial<AppConfig>): void {
    ConfigManager.config = ObjectUtils.merge(ConfigManager.config, newConfig);
  }
}
```

### 4. 状态管理模式

#### 场景：组件状态管理
```typescript
interface StateData {
  isLoading: boolean;
  data: string[];
  error: string | null;
}

class StateManager {
  private static state: StateData = {
    isLoading: false,
    data: [],
    error: null
  };

  static getState(): StateData {
    return { ...StateManager.state };
  }

  static setLoading(loading: boolean): void {
    StateManager.state.isLoading = loading;
  }

  static setData(newData: string[]): void {
    StateManager.state.data = newData;
    StateManager.state.error = null;
  }

  static setError(error: string): void {
    StateManager.state.error = error;
    StateManager.state.isLoading = false;
  }
}
```

### 5. 数据转换场景

#### 场景：API响应数据转换
```typescript
interface ApiResponse {
  id: string;
  attributes: {
    name: string;
    value: number;
  };
  relationships: {
    category: {
      data: { id: string; type: string };
    };
  };
}

interface LocalData {
  id: number;
  name: string;
  value: number;
  categoryId: string;
}

class DataTransformer {
  static transformResponse(response: ApiResponse): LocalData {
    return {
      id: parseInt(response.id),
      name: response.attributes.name,
      value: response.attributes.value,
      categoryId: response.relationships.category.data.id
    };
  }

  static transformBatch(responses: ApiResponse[]): LocalData[] {
    const result: LocalData[] = [];
    for (let i = 0; i < responses.length; i++) {
      result.push(DataTransformer.transformResponse(responses[i]));
    }
    return result;
  }
}
```

### 6. 事件处理模式

#### 场景：自定义事件系统
```typescript
interface EventData {
  type: string;
  payload: Object;
}

interface EventHandler {
  (data: EventData): void;
}

class EventManager {
  private static listeners: Map<string, EventHandler[]> = new Map();

  static addListener(eventType: string, handler: EventHandler): void {
    const handlers = EventManager.listeners.get(eventType);
    if (handlers) {
      handlers.push(handler);
    } else {
      EventManager.listeners.set(eventType, [handler]);
    }
  }

  static removeListener(eventType: string, handler: EventHandler): void {
    const handlers = EventManager.listeners.get(eventType);
    if (handlers) {
      for (let i = handlers.length - 1; i >= 0; i--) {
        if (handlers[i] === handler) {
          handlers.splice(i, 1);
        }
      }
    }
  }

  static emit(eventData: EventData): void {
    const handlers = EventManager.listeners.get(eventData.type);
    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i](eventData);
      }
    }
  }
}
```

## 🔧 性能优化建议

### 1. 避免不必要的对象创建
```typescript
// ❌ 频繁创建临时对象
function processItems(items: string[]): number {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    const temp = { value: parseInt(items[i]) }; // 每次循环都创建新对象
    sum += temp.value;
  }
  return sum;
}

// ✅ 避免临时对象创建
function processItems(items: string[]): number {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += parseInt(items[i]);
  }
  return sum;
}
```

### 2. 缓存计算结果
```typescript
class Calculator {
  private static cache: Map<string, number> = new Map();

  static expensiveCalculation(input: string): number {
    const cached = Calculator.cache.get(input);
    if (cached !== undefined) {
      return cached;
    }

    // 模拟复杂计算
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += input.length * i;
    }
    
    Calculator.cache.set(input, result);
    return result;
  }
}
```

### 3. 批量操作优化
```typescript
interface DataItem {
  id: number;
  value: string;
}

// ❌ 多次单独操作
function updateItemsIndividually(items: DataItem[]): void {
  for (let i = 0; i < items.length; i++) {
    updateSingleItem(items[i]);
  }
}

// ✅ 批量操作
function updateItemsBatch(items: DataItem[]): void {
  const updates: string[] = [];
  for (let i = 0; i < items.length; i++) {
    updates.push(`UPDATE items SET value = '${items[i].value}' WHERE id = ${items[i].id}`);
  }
  executeBatch(updates);
}
```

## 🎯 实际开发案例与解决方案

### 8. 枚举类型扩展与接口同步

#### 场景：新增枚举值导致的编译错误
```typescript
// 原始接口定义
export interface GejuPattern {
  id: string;
  name: string;
  description: string;
  palaceIndices: number[];
  level: 'minor' | 'major' | 'special';  // 原始枚举值
}

// ❌ 新增'moderate'值时报错
const pattern: GejuPattern = {
  id: 'test',
  name: '测试',
  description: '描述',
  palaceIndices: [0],
  level: 'moderate'  // 编译错误：Type '"moderate"' is not assignable to type '"minor" | "major" | "special"'
};
```

#### ✅ 正确解决方案
```typescript
// 更新接口定义，扩展枚举值
export interface GejuPattern {
  id: string;
  name: string;
  description: string;
  palaceIndices: number[];
  level: 'minor' | 'major' | 'special' | 'moderate';  // 扩展枚举值
}

// 或使用类型别名
type GejuLevel = 'minor' | 'major' | 'special' | 'moderate';
export interface GejuPattern {
  id: string;
  name: string;
  description: string;
  palaceIndices: number[];
  level: GejuLevel;
}
```

### 9. 对象属性访问的安全处理

#### 场景：处理可选属性的null/undefined检查
```typescript
interface PalaceState {
  palace: number;
  palaceName: string;
  doorName?: string;  // 可选属性
  tianGan?: string;
  diGan?: string;
}

// ❌ 直接访问可选属性可能导致运行时错误
function processPalace(palace: PalaceState) {
  const door = palace.doorName;  // 可能为undefined
  if (door.includes('休')) {     // 运行时错误：Cannot read property 'includes' of undefined
    // 处理逻辑
  }
}

// ✅ 安全的属性访问方式
function processPalaceSafe(palace: PalaceState) {
  const door: string = palace.doorName || '';  // 提供默认值
  if (door && door.includes('休')) {           // 先检查是否存在
    // 处理逻辑
  }
}

// ✅ 使用类型守卫
function isValidDoor(door: string | undefined): door is string {
  return door !== undefined && door !== null && door.length > 0;
}

function processPalaceGuard(palace: PalaceState) {
  if (isValidDoor(palace.doorName)) {
    const door = palace.doorName;  // TypeScript知道这里door是string类型
    if (door.includes('休')) {
      // 处理逻辑
    }
  }
}
```

### 10. 数组操作的安全模式

#### 场景：数组遍历和查找操作
```typescript
interface Pattern {
  id: string;
  name: string;
  palaceIndices: number[];
}

// ❌ 不安全的数组访问
function findPatternById(patterns: Pattern[], id: string): Pattern {
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].id === id) {
      return patterns[i];
    }
  }
  return patterns[0];  // 可能返回undefined元素的风险
}

// ✅ 安全的数组操作
function findPatternByIdSafe(patterns: Pattern[], id: string): Pattern | undefined {
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].id === id) {
      return patterns[i];
    }
  }
  return undefined;  // 明确返回undefined
}

// ✅ 使用工具类方法
class ArrayUtils {
  static find<T>(items: T[], predicate: (item: T) => boolean): T | undefined {
    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i])) {
        return items[i];
      }
    }
    return undefined;
  }
  
  static filter<T>(items: T[], predicate: (item: T) => boolean): T[] {
    const result: T[] = [];
    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i])) {
        result.push(items[i]);
      }
    }
    return result;
  }
}

// 使用示例
const foundPattern = ArrayUtils.find(patterns, p => p.id === targetId);
```

### 11. 字符串处理的安全模式

#### 场景：字符串包含检查和格式化
```typescript
// ❌ 不安全的字符串操作
function containsPattern(patternName: string, target: string): boolean {
  return patternName.includes(target);  // 如果patternName为undefined会报错
}

// ✅ 安全的字符串处理
function containsPatternSafe(patternName: string, target: string): boolean {
  if (!patternName || !target) {
    return false;
  }
  return patternName.includes(target);
}

// ✅ 使用类型守卫
function isValidString(str: string | undefined): str is string {
  return typeof str === 'string' && str.length > 0;
}

function containsPatternGuard(patternName: string | undefined, target: string): boolean {
  if (!isValidString(patternName) || !isValidString(target)) {
    return false;
  }
  return patternName.includes(target);
}
```

### 12. 条件渲染的最佳实践

#### 场景：UI组件中的条件显示
```typescript
// ❌ 不清晰的条件判断
@Builder
buildConditionally() {
  if (this.showWarning) {
    Text('警告信息')
  }
  // 其他组件...
}

// ✅ 清晰的条件渲染
@Builder
buildWarningSection() {
  if (this.showWarning) {
    Column() {
      Text('⚠️ 警告')
        .fontColor('#FF4444')
        .fontSize(16)
      Text(this.warningMessage)
        .fontColor('#666666')
        .fontSize(14)
    }
    .padding(12)
    .backgroundColor('#FFF0F0')
    .border({ width: 1, color: '#FF4444' })
  }
}

@Builder
buildMainContent() {
  Column() {
    this.buildWarningSection()
    // 主要内容...
  }
}
```

### 13. 状态管理的安全模式

#### 场景：组件状态更新
```typescript
// ❌ 不安全的状态更新
@Component
struct MyComponent {
  @State count: number = 0;
  
  increment() {
    this.count++;  // 直接修改状态
  }
}

// ✅ 安全的状态管理
@Component
struct MyComponent {
  @State count: number = 0;
  @State isLoading: boolean = false;
  
  private updateCount(newValue: number): void {
    if (newValue >= 0) {  // 添加验证
      this.count = newValue;
    }
  }
  
  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      const data = await fetchData();
      this.updateCount(data.count);
    } catch (error) {
      // 错误处理
    } finally {
      this.isLoading = false;
    }
  }
}
```

### 14. 错误处理模式

#### 场景：异步操作的错误处理
```typescript
// ❌ 不完善的错误处理
async function loadUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
}

// ✅ 完善的错误处理
interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function loadUserDataSafe(userId: string): Promise<ApiResult<User>> {
  try {
    if (!userId) {
      return { success: false, error: '用户ID不能为空' };
    }
    
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    };
  }
}

// 使用示例
const result = await loadUserDataSafe('123');
if (result.success && result.data) {
  // 处理成功情况
  processUser(result.data);
} else {
  // 处理错误情况
  showError(result.error || '加载失败');
}
```

### 15. 性能优化实践

#### 场景：避免重复计算和渲染
```typescript
@Component
struct OptimizedComponent {
  @State items: string[] = [];
  @State searchTerm: string = '';
  
  // ❌ 每次渲染都重新计算
  private get filteredItems(): string[] {
    return this.items.filter(item => 
      item.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
  
  // ✅ 使用记忆化计算
  private memoizedFilteredItems: string[] | null = null;
  private lastSearchTerm: string = '';
  
  private getFilteredItems(): string[] {
    if (this.memoizedFilteredItems === null || this.lastSearchTerm !== this.searchTerm) {
      this.memoizedFilteredItems = this.items.filter(item => 
        item.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.lastSearchTerm = this.searchTerm;
    }
    return this.memoizedFilteredItems;
  }
  
  // ✅ 使用防抖优化输入处理
  private debounceTimer: number | null = null;
  
  private debouncedSearch(term: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.searchTerm = term;
      this.memoizedFilteredItems = null;  // 清除缓存
    }, 300);
  }
}
```

### 16. 组件通信模式

#### 场景：父子组件间的数据传递
```typescript
// 子组件
@Component
struct ChildComponent {
  @Prop title: string;
  @Link count: number;
  @Provide('theme') theme: string = 'light';
  
  build() {
    Column() {
      Text(this.title)
      Button('增加')
        .onClick(() => {
          this.count++;
        })
    }
  }
}

// 父组件
@Component
struct ParentComponent {
  @State childTitle: string = '子组件标题';
  @State counter: number = 0;
  @Consume('theme') appTheme: string;
  
  build() {
    Column() {
      Text(`计数器: ${this.counter}`)
      ChildComponent({
        title: this.childTitle,
        count: this.$counter
      })
    }
  }
}
```

### 17. 网络请求封装模式

#### 场景：统一的API请求处理
```typescript
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

class HttpClient {
  private static baseUrl = 'https://api.example.com';
  
  static async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(endpoint, this.baseUrl);
      if (params) {
        Object.keys(params).forEach(key => {
          url.searchParams.append(key, params[key]);
        });
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      throw new Error(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  static async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      throw new Error(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// 使用示例
interface User {
  id: number;
  name: string;
  email: string;
}

async function loadUsers(): Promise<User[]> {
  try {
    const response = await HttpClient.get<User[]>('/users');
    if (response.code === 200) {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('加载用户失败:', error);
    return [];
  }
}
```

### 18. 本地存储管理

#### 场景：应用数据持久化
```typescript
interface StorageKeys {
  USER_PREFERENCES: 'user_preferences';
  RECENT_SEARCHES: 'recent_searches';
  APP_SETTINGS: 'app_settings';
}

class StorageManager {
  private static readonly PREFIX = 'fu_ying_';
  
  static setItem<T>(key: keyof StorageKeys, value: T): void {
    try {
      const fullKey = `${this.PREFIX}${key}`;
      const serializedValue = JSON.stringify(value);
      Preferences.set(fullKey, serializedValue);
    } catch (error) {
      console.error('存储数据失败:', error);
    }
  }
  
  static getItem<T>(key: keyof StorageKeys, defaultValue: T): T {
    try {
      const fullKey = `${this.PREFIX}${key}`;
      const storedValue = Preferences.get(fullKey, '');
      
      if (storedValue) {
        return JSON.parse(storedValue);
      }
      return defaultValue;
    } catch (error) {
      console.error('读取数据失败:', error);
      return defaultValue;
    }
  }
  
  static removeItem(key: keyof StorageKeys): void {
    try {
      const fullKey = `${this.PREFIX}${key}`;
      Preferences.delete(fullKey);
    } catch (error) {
      console.error('删除数据失败:', error);
    }
  }
  
  static clearAll(): void {
    try {
      const keys = Object.values(StorageKeys);
      keys.forEach(key => {
        const fullKey = `${this.PREFIX}${key}`;
        Preferences.delete(fullKey);
      });
    } catch (error) {
      console.error('清空数据失败:', error);
    }
  }
}

// 使用示例
interface UserPreferences {
  theme: 'light' | 'dark';
  fontSize: number;
  notifications: boolean;
}

// 保存用户偏好
const preferences: UserPreferences = {
  theme: 'dark',
  fontSize: 16,
  notifications: true
};
StorageManager.setItem('USER_PREFERENCES', preferences);

// 读取用户偏好
const savedPreferences = StorageManager.getItem('USER_PREFERENCES', {
  theme: 'light',
  fontSize: 14,
  notifications: false
});
```

### 19. 事件总线模式

#### 场景：跨组件通信
```typescript
interface EventBusEvent {
  type: string;
  data?: any;
}

type EventCallback = (event: EventBusEvent) => void;

class EventBus {
  private static listeners: Map<string, EventCallback[]> = new Map();
  
  static on(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.push(callback);
    } else {
      this.listeners.set(eventType, [callback]);
    }
  }
  
  static off(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  static emit(eventType: string, data?: any): void {
    const event: EventBusEvent = { type: eventType, data };
    const callbacks = this.listeners.get(eventType);
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('事件处理出错:', error);
        }
      });
    }
  }
  
  static once(eventType: string, callback: EventCallback): void {
    const onceCallback: EventCallback = (event) => {
      callback(event);
      this.off(eventType, onceCallback);
    };
    this.on(eventType, onceCallback);
  }
}

// 使用示例
// 组件A - 发送事件
@Component
struct ComponentA {
  private sendData(): void {
    EventBus.emit('data_updated', {
      timestamp: Date.now(),
      data: '新数据'
    });
  }
  
  build() {
    Button('发送数据')
      .onClick(() => this.sendData())
  }
}

// 组件B - 接收事件
@Component
struct ComponentB {
  @State receivedData: string = '';
  
  aboutToAppear() {
    EventBus.on('data_updated', (event) => {
      this.receivedData = event.data.data;
    });
  }
  
  aboutToDisappear() {
    EventBus.off('data_updated');
  }
  
  build() {
    Text(`收到数据: ${this.receivedData}`)
  }
}
```

### 20. 国际化支持模式

#### 场景：多语言支持
```typescript
interface LanguageResources {
  zh: Record<string, string>;
  en: Record<string, string>;
}

class I18n {
  private static currentLanguage: 'zh' | 'en' = 'zh';
  private static resources: LanguageResources = {
    zh: {
      'welcome': '欢迎使用遁甲研习台',
      'settings': '设置',
      'save': '保存',
      'cancel': '取消'
    },
    en: {
      'welcome': 'Welcome to Dunjia Study Platform',
      'settings': 'Settings',
      'save': 'Save',
      'cancel': 'Cancel'
    }
  };
  
  static setLanguage(lang: 'zh' | 'en'): void {
    this.currentLanguage = lang;
    // 可以在这里触发语言切换事件
    EventBus.emit('language_changed', { language: lang });
  }
  
  static getCurrentLanguage(): 'zh' | 'en' {
    return this.currentLanguage;
  }
  
  static t(key: string, params?: Record<string, any>): string {
    const translation = this.resources[this.currentLanguage][key] || key;
    
    if (params) {
      return translation.replace(/\{([^}]+)\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }
    
    return translation;
  }
  
  static addTranslations(lang: 'zh' | 'en', translations: Record<string, string>): void {
    this.resources[lang] = { ...this.resources[lang], ...translations };
  }
}

// 使用示例
@Component
struct SettingsPage {
  @State currentLang: 'zh' | 'en' = I18n.getCurrentLanguage();
  
  private switchLanguage(): void {
    const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
    I18n.setLanguage(newLang);
    this.currentLang = newLang;
  }
  
  build() {
    Column() {
      Text(I18n.t('settings'))
        .fontSize(20)
        .margin({ bottom: 20 })
      
      Button(`${I18n.t('switch_to')} ${this.currentLang === 'zh' ? 'English' : '中文'}`)
        .onClick(() => this.switchLanguage())
    }
    .padding(20)
  }
}

// 动态文本示例
const welcomeMessage = I18n.t('welcome_user', { name: '张三' });
// 如果翻译是 '欢迎 {name}'，结果就是 '欢迎 张三'
```

### 21. 主题系统实现

#### 场景：应用主题切换
```typescript
interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
}

interface Theme {
  name: 'light' | 'dark';
  colors: ThemeColors;
}

class ThemeManager {
  private static themes: Record<'light' | 'dark', Theme> = {
    light: {
      name: 'light',
      colors: {
        primary: '#007AFF',
        secondary: '#34C759',
        background: '#FFFFFF',
        text: '#000000',
        border: '#E5E5EA'
      }
    },
    dark: {
      name: 'dark',
      colors: {
        primary: '#0A84FF',
        secondary: '#32D74B',
        background: '#000000',
        text: '#FFFFFF',
        border: '#3A3A3C'
      }
    }
  };
  
  private static currentTheme: Theme = this.themes.light;
  
  static setTheme(themeName: 'light' | 'dark'): void {
    this.currentTheme = this.themes[themeName];
    StorageManager.setItem('APP_THEME', themeName);
    EventBus.emit('theme_changed', { theme: this.currentTheme });
  }
  
  static getCurrentTheme(): Theme {
    return this.currentTheme;
  }
  
  static getColor(colorName: keyof ThemeColors): string {
    return this.currentTheme.colors[colorName];
  }
  
  static initialize(): void {
    const savedTheme = StorageManager.getItem('APP_THEME', 'light' as 'light' | 'dark');
    this.setTheme(savedTheme);
  }
}

// 使用示例
@Component
struct ThemedButton {
  @Prop text: string;
  @Prop onPress: () => void;
  
  build() {
    Button(this.text)
      .backgroundColor(ThemeManager.getColor('primary'))
      .fontColor(ThemeManager.getColor('background'))
      .borderRadius(8)
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .onClick(this.onPress)
  }
}

@Component
struct MainPage {
  @State theme: Theme = ThemeManager.getCurrentTheme();
  
  aboutToAppear() {
    ThemeManager.initialize();
    EventBus.on('theme_changed', (event) => {
      this.theme = event.data.theme;
    });
  }
  
  private toggleTheme(): void {
    const newTheme = this.theme.name === 'light' ? 'dark' : 'light';
    ThemeManager.setTheme(newTheme);
  }
  
  build() {
    Column() {
      Text('遁甲研习台')
        .fontColor(this.theme.colors.text)
        .fontSize(24)
        .margin({ bottom: 20 })
      
      ThemedButton({
        text: '切换主题',
        onPress: () => this.toggleTheme()
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.theme.colors.background)
  }
}
```

### 22. 表单验证模式

#### 场景：用户输入验证
```typescript
interface ValidationRule {
  validator: (value: string) => boolean;
  message: string;
}

interface FormField {
  name: string;
  value: string;
  rules: ValidationRule[];
  error?: string;
}

class FormValidator {
  static validateField(field: FormField): boolean {
    for (const rule of field.rules) {
      if (!rule.validator(field.value)) {
        field.error = rule.message;
        return false;
      }
    }
    field.error = undefined;
    return true;
  }
  
  static validateForm(fields: FormField[]): boolean {
    let isValid = true;
    for (const field of fields) {
      if (!this.validateField(field)) {
        isValid = false;
      }
    }
    return isValid;
  }
  
  static getErrorMessage(field: FormField): string | undefined {
    return field.error;
  }
}

// 预定义验证规则
class ValidationRules {
  static required(message: string = '此字段为必填项'): ValidationRule {
    return {
      validator: (value: string) => value.trim().length > 0,
      message
    };
  }
  
  static minLength(length: number, message?: string): ValidationRule {
    return {
      validator: (value: string) => value.length >= length,
      message: message || `长度不能少于${length}个字符`
    };
  }
  
  static maxLength(length: number, message?: string): ValidationRule {
    return {
      validator: (value: string) => value.length <= length,
      message: message || `长度不能超过${length}个字符`
    };
  }
  
  static email(message: string = '请输入有效的邮箱地址'): ValidationRule {
    return {
      validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message
    };
  }
  
  static phone(message: string = '请输入有效的手机号码'): ValidationRule {
    return {
      validator: (value: string) => /^1[3-9]\d{9}$/.test(value),
      message
    };
  }
}

// 使用示例
@Component
struct RegistrationForm {
  @State username: FormField = {
    name: 'username',
    value: '',
    rules: [
      ValidationRules.required('用户名不能为空'),
      ValidationRules.minLength(3, '用户名至少3个字符'),
      ValidationRules.maxLength(20, '用户名不能超过20个字符')
    ]
  };
  
  @State email: FormField = {
    name: 'email',
    value: '',
    rules: [
      ValidationRules.required('邮箱不能为空'),
      ValidationRules.email('请输入有效的邮箱地址')
    ]
  };
  
  @State phone: FormField = {
    name: 'phone',
    value: '',
    rules: [
      ValidationRules.required('手机号不能为空'),
      ValidationRules.phone('请输入有效的手机号码')
    ]
  };
  
  private validateAndSubmit(): void {
    const fields = [this.username, this.email, this.phone];
    
    if (FormValidator.validateForm(fields)) {
      // 表单验证通过，提交数据
      console.log('表单提交成功');
    } else {
      // 显示错误信息
      console.log('表单验证失败');
    }
  }
  
  private updateField(field: FormField, value: string): void {
    field.value = value;
    FormValidator.validateField(field);
  }
  
  @Builder
  buildInputField(field: FormField, placeholder: string) {
    Column({ space: 4 }) {
      TextInput({
        placeholder: placeholder,
        text: field.value
      })
      .onChange((value: string) => this.updateField(field, value))
      .border({ width: 1, color: field.error ? '#FF3B30' : '#CCCCCC' })
      .borderRadius(4)
      .padding(12)
      
      if (field.error) {
        Text(field.error)
          .fontColor('#FF3B30')
          .fontSize(12)
      }
    }
  }
  
  build() {
    Column({ space: 16 }) {
      this.buildInputField(this.username, '用户名')
      this.buildInputField(this.email, '邮箱')
      this.buildInputField(this.phone, '手机号')
      
      Button('注册')
        .onClick(() => this.validateAndSubmit())
        .backgroundColor('#007AFF')
        .fontColor('#FFFFFF')
        .borderRadius(8)
        .padding({ left: 20, right: 20, top: 12, bottom: 12 })
    }
    .padding(20)
  }
}
```

### 23. 数据缓存策略

#### 场景：提升应用性能
```typescript
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private static cache: Map<string, CacheItem<any>> = new Map();
  
  static set<T>(key: string, data: T, ttl: number = 300000): void { // 默认5分钟
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    this.cache.set(key, cacheItem);
  }
  
  static get<T>(key: string): T | null {
    const cacheItem = this.cache.get(key);
    
    if (!cacheItem) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cacheItem.data;
  }
  
  static has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }
  
  static remove(key: string): void {
    this.cache.delete(key);
  }
  
  static clear(): void {
    this.cache.clear();
  }
  
  static getSize(): number {
    return this.cache.size;
  }
  
  // 清理过期缓存
  static cleanupExpired(): void {
    const now = Date.now();
    for (const [key, cacheItem] of this.cache.entries()) {
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  // 定期清理过期缓存
  static startCleanupInterval(interval: number = 60000): void { // 默认每分钟清理一次
    setInterval(() => {
      this.cleanupExpired();
    }, interval);
  }
}

// 使用示例
class DataService {
  private static CACHE_KEYS = {
    USER_LIST: 'user_list',
    SETTINGS: 'app_settings',
    RECENT_DATA: 'recent_data'
  };
  
  static async getUserList(forceRefresh: boolean = false): Promise<User[]> {
    // 检查缓存
    if (!forceRefresh) {
      const cached = CacheManager.get<User[]>(this.CACHE_KEYS.USER_LIST);
      if (cached) {
        return cached;
      }
    }
    
    // 从网络获取
    try {
      const response = await HttpClient.get<User[]>('/users');
      const users = response.data;
      
      // 缓存数据（10分钟）
      CacheManager.set(this.CACHE_KEYS.USER_LIST, users, 600000);
      
      return users;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  }
  
  static async getSettings(): Promise<AppSettings> {
    // 设置通常变化较少，可以缓存较长时间
    const cached = CacheManager.get<AppSettings>(this.CACHE_KEYS.SETTINGS);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await HttpClient.get<AppSettings>('/settings');
      const settings = response.data;
      
      // 缓存24小时
      CacheManager.set(this.CACHE_KEYS.SETTINGS, settings, 86400000);
      
      return settings;
    } catch (error) {
      console.error('获取设置失败:', error);
      return getDefaultSettings();
    }
  }
}

// 应用启动时初始化缓存管理
@Component
struct App {
  aboutToAppear() {
    // 启动定期清理
    CacheManager.startCleanupInterval();
    
    // 预加载一些常用数据
    DataService.getSettings();
  }
  
  build() {
    // 应用根组件
  }
}
```

### 24. 日志管理系统

#### 场景：应用日志记录和调试
```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  stack?: string;
}

class Logger {
  private static minLevel: LogLevel = LogLevel.INFO;
  private static maxEntries: number = 1000;
  private static logs: LogEntry[] = [];
  private static isDevMode: boolean = false;
  
  static setLogLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  static setDevMode(isDev: boolean): void {
    this.isDevMode = isDev;
  }
  
  static debug(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.DEBUG, message, ...optionalParams);
  }
  
  static info(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.INFO, message, ...optionalParams);
  }
  
  static warn(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.WARN, message, ...optionalParams);
  }
  
  static error(message: string, error?: Error, ...optionalParams: any[]): void {
    const stack = error ? error.stack : undefined;
    this.log(LogLevel.ERROR, message, stack, ...optionalParams);
  }
  
  private static log(level: LogLevel, message: string, ...params: any[]): void {
    // 检查日志级别
    if (level < this.minLevel) {
      return;
    }
    
    const entry: LogEntry = {
      level,
      message: this.formatMessage(message, params),
      timestamp: Date.now(),
      stack: params.find(param => param instanceof Error)?.stack
    };
    
    // 添加到日志数组
    this.logs.push(entry);
    
    // 限制日志数量
    if (this.logs.length > this.maxEntries) {
      this.logs.shift();
    }
    
    // 输出到控制台
    this.outputToConsole(entry);
    
    // 在开发模式下可能输出到其他地方
    if (this.isDevMode) {
      this.outputToDevTools(entry);
    }
  }
  
  private static formatMessage(message: string, params: any[]): string {
    if (params.length === 0) {
      return message;
    }
    
    try {
      return `${message} ${params.map(param => 
        typeof param === 'object' ? JSON.stringify(param) : String(param)
      ).join(' ')}`;
    } catch (error) {
      return `${message} [参数序列化失败]`;
    }
  }
  
  private static outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelStr = LogLevel[entry.level];
    
    const consoleMessage = `[${timestamp}] [${levelStr}] ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage);
        break;
      case LogLevel.INFO:
        console.info(consoleMessage);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage);
        break;
      case LogLevel.ERROR:
        console.error(consoleMessage);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }
  
  private static outputToDevTools(entry: LogEntry): void {
    // 可以在这里添加发送到远程调试工具的逻辑
    // 例如发送到WebSocket服务器或写入文件
  }
  
  static getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }
  
  static clearLogs(): void {
    this.logs = [];
  }
  
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
  
  static async saveLogsToFile(): Promise<void> {
    try {
      const logs = this.exportLogs();
      // 这里可以实现保存到文件的逻辑
      // 例如使用文件系统API
      console.log('日志已保存');
    } catch (error) {
      this.error('保存日志失败', error as Error);
    }
  }
}

// 使用示例
@Component
struct LoginPage {
  @State username: string = '';
  @State password: string = '';
  
  private async login(): Promise<void> {
    Logger.info('开始登录流程', { username: this.username });
    
    try {
      if (!this.username || !this.password) {
        Logger.warn('用户名或密码为空');
        return;
      }
      
      const response = await HttpClient.post<LoginResponse>('/login', {
        username: this.username,
        password: this.password
      });
      
      if (response.code === 200) {
        Logger.info('登录成功', { userId: response.data.userId });
        // 处理登录成功
      } else {
        Logger.warn('登录失败', { code: response.code, message: response.message });
        // 处理登录失败
      }
      
    } catch (error) {
      Logger.error('登录过程发生错误', error as Error);
      // 处理异常
    }
  }
  
  build() {
    Column({ space: 16 }) {
      TextInput({ placeholder: '用户名', text: this.username })
        .onChange((value) => this.username = value)
      
      TextInput({ placeholder: '密码', text: this.password })
        .onChange((value) => this.password = value)
        .type(InputType.Password)
      
      Button('登录')
        .onClick(() => this.login())
    }
    .padding(20)
  }
}

// 应用初始化时配置日志
@Component
struct App {
  aboutToAppear() {
    // 根据环境设置日志级别
    if (__DEV__) {
      Logger.setLogLevel(LogLevel.DEBUG);
      Logger.setDevMode(true);
    } else {
      Logger.setLogLevel(LogLevel.WARN);
    }
    
    Logger.info('应用启动');
  }
  
  build() {
    // 应用根组件
  }
}
```

### 25. 权限管理模块

#### 场景：应用权限申请和管理
```typescript
enum PermissionType {
  CAMERA = 'ohos.permission.CAMERA',
  LOCATION = 'ohos.permission.LOCATION',
  STORAGE = 'ohos.permission.WRITE_USER_STORAGE',
  MICROPHONE = 'ohos.permission.MICROPHONE'
}

interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  restricted: boolean;
}

class PermissionManager {
  private static permissionCache: Map<PermissionType, PermissionStatus> = new Map();
  
  static async requestPermission(permission: PermissionType): Promise<boolean> {
    try {
      // 检查缓存
      const cachedStatus = this.permissionCache.get(permission);
      if (cachedStatus && cachedStatus.granted) {
        return true;
      }
      
      // 请求权限
      const status = await requestPermissions([permission]);
      const granted = status[0] === 0; // 0表示授权成功
      
      // 更新缓存
      this.permissionCache.set(permission, {
        granted,
        denied: !granted,
        restricted: false
      });
      
      Logger.info('权限申请结果', { permission, granted });
      return granted;
      
    } catch (error) {
      Logger.error('权限申请失败', error as Error, { permission });
      return false;
    }
  }
  
  static async checkPermission(permission: PermissionType): Promise<PermissionStatus> {
    try {
      // 检查缓存
      const cachedStatus = this.permissionCache.get(permission);
      if (cachedStatus) {
        return cachedStatus;
      }
      
      // 检查实际权限状态
      const status = await checkPermissions([permission]);
      const permissionStatus: PermissionStatus = {
        granted: status[0] === 0,
        denied: status[0] === -1,
        restricted: status[0] === 1
      };
      
      // 更新缓存
      this.permissionCache.set(permission, permissionStatus);
      
      return permissionStatus;
      
    } catch (error) {
      Logger.error('权限检查失败', error as Error, { permission });
      return { granted: false, denied: true, restricted: false };
    }
  }
  
  static async requestMultiplePermissions(permissions: PermissionType[]): Promise<Record<PermissionType, boolean>> {
    const results: Record<PermissionType, boolean> = {} as Record<PermissionType, boolean>;
    
    for (const permission of permissions) {
      results[permission] = await this.requestPermission(permission);
    }
    
    return results;
  }
  
  static clearCache(): void {
    this.permissionCache.clear();
  }
  
  static getDeniedPermissions(): PermissionType[] {
    const denied: PermissionType[] = [];
    for (const [permission, status] of this.permissionCache.entries()) {
      if (status.denied || !status.granted) {
        denied.push(permission);
      }
    }
    return denied;
  }
}

// 权限申请组件
@Component
struct PermissionRequestDialog {
  @Prop permission: PermissionType;
  @Prop onResult: (granted: boolean) => void;
  @State isRequesting: boolean = false;
  
  private async request(): Promise<void> {
    this.isRequesting = true;
    
    try {
      const granted = await PermissionManager.requestPermission(this.permission);
      this.onResult(granted);
    } catch (error) {
      Logger.error('权限申请组件错误', error as Error);
      this.onResult(false);
    } finally {
      this.isRequesting = false;
    }
  }
  
  build() {
    AlertDialog({
      title: '权限申请',
      message: this.getPermissionDescription(this.permission),
      autoCancel: false,
      alignment: DialogAlignment.Center,
      offset: { dx: 0, dy: -20 },
      confirm: {
        value: '允许',
        enabled: !this.isRequesting,
        action: () => this.request()
      },
      cancel: {
        value: '拒绝',
        enabled: !this.isRequesting,
        action: () => this.onResult(false)
      }
    });
  }
  
  private getPermissionDescription(permission: PermissionType): string {
    switch (permission) {
      case PermissionType.CAMERA:
        return '应用需要访问相机权限来拍摄照片和视频';
      case PermissionType.LOCATION:
        return '应用需要位置权限来提供基于位置的服务';
      case PermissionType.STORAGE:
        return '应用需要存储权限来保存和读取文件';
      case PermissionType.MICROPHONE:
        return '应用需要麦克风权限来进行语音录制';
      default:
        return '应用需要相关权限才能正常工作';
    }
  }
}

// 使用示例
@Component
struct CameraPage {
  @State hasCameraPermission: boolean = false;
  @State showPermissionDialog: boolean = false;
  
  aboutToAppear() {
    this.checkCameraPermission();
  }
  
  private async checkCameraPermission(): Promise<void> {
    const status = await PermissionManager.checkPermission(PermissionType.CAMERA);
    this.hasCameraPermission = status.granted;
    
    if (!this.hasCameraPermission) {
      this.showPermissionDialog = true;
    }
  }
  
  private handlePermissionResult(granted: boolean): void {
    this.hasCameraPermission = granted;
    this.showPermissionDialog = false;
    
    if (granted) {
      Logger.info('相机权限已获得，可以正常使用相机功能');
    } else {
      Logger.warn('相机权限被拒绝，部分功能可能无法使用');
      // 可以显示提示信息或引导用户到设置页面
    }
  }
  
  build() {
    Column() {
      if (this.hasCameraPermission) {
        // 相机预览组件
        CameraPreview()
      } else {
        // 权限被拒绝时的提示界面
        Column({ space: 16 }) {
          Image($r('app.media.camera_disabled'))
            .width(100)
            .height(100)
          
          Text('需要相机权限')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
          
          Text('请在设置中授予相机权限以使用拍照功能')
            .fontSize(14)
            .fontColor('#666666')
            .textAlign(TextAlign.Center)
        }
        .padding(32)
      }
      
      if (this.showPermissionDialog) {
        PermissionRequestDialog({
          permission: PermissionType.CAMERA,
          onResult: (granted) => this.handlePermissionResult(granted)
        })
      }
    }
  }
}
```

### 26. 应用生命周期管理

#### 场景：应用前后台状态监听
```typescript
class AppStateManager {
  private static instance: AppStateManager;
  private static listeners: Array<(state: AppState) => void> = [];
  private static currentState: AppState = AppState.BACKGROUND;
  private static backgroundTimer: number | null = null;
  private static readonly BACKGROUND_DELAY = 30000; // 30秒后认为进入后台
  
  static getInstance(): AppStateManager {
    if (!this.instance) {
      this.instance = new AppStateManager();
    }
    return this.instance;
  }
  
  static addListener(listener: (state: AppState) => void): void {
    this.listeners.push(listener);
  }
  
  static removeListener(listener: (state: AppState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  static getCurrentState(): AppState {
    return this.currentState;
  }
  
  static notifyAppStateChange(newState: AppState): void {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.listeners.forEach(listener => {
        try {
          listener(newState);
        } catch (error) {
          Logger.error('应用状态监听器执行错误', error as Error);
        }
      });
      
      Logger.info('应用状态变更', { from: AppState[this.currentState], to: AppState[newState] });
    }
  }
  
  static handleAppForeground(): void {
    // 取消后台定时器
    if (this.backgroundTimer) {
      clearTimeout(this.backgroundTimer);
      this.backgroundTimer = null;
    }
    
    this.notifyAppStateChange(AppState.FOREGROUND);
  }
  
  static handleAppBackground(): void {
    // 设置延迟确认后台状态
    this.backgroundTimer = setTimeout(() => {
      this.notifyAppStateChange(AppState.BACKGROUND);
    }, this.BACKGROUND_DELAY);
  }
  
  static handleAppDestroy(): void {
    this.notifyAppStateChange(AppState.DESTROYED);
    // 清理资源
    this.cleanup();
  }
  
  private static cleanup(): void {
    if (this.backgroundTimer) {
      clearTimeout(this.backgroundTimer);
      this.backgroundTimer = null;
    }
    this.listeners = [];
  }
}

enum AppState {
  FOREGROUND = 'foreground',
  BACKGROUND = 'background',
  DESTROYED = 'destroyed'
}

// 应用入口组件
@Component
struct MyApp {
  private appStateMgr: AppStateManager = AppStateManager.getInstance();
  
  aboutToAppear() {
    // 初始化应用状态管理
    this.appStateMgr.addListener(this.handleAppStateChange.bind(this));
    this.appStateMgr.handleAppForeground();
    
    Logger.info('应用启动');
  }
  
  aboutToDisappear() {
    this.appStateMgr.handleAppDestroy();
    Logger.info('应用销毁');
  }
  
  onPageShow() {
    this.appStateMgr.handleAppForeground();
  }
  
  onPageHide() {
    this.appStateMgr.handleAppBackground();
  }
  
  private handleAppStateChange(state: AppState): void {
    switch (state) {
      case AppState.FOREGROUND:
        this.handleAppForeground();
        break;
      case AppState.BACKGROUND:
        this.handleAppBackground();
        break;
      case AppState.DESTROYED:
        this.handleAppDestroy();
        break;
    }
  }
  
  private handleAppForeground(): void {
    Logger.info('应用进入前台');
    // 恢复数据同步
    // 刷新UI
    // 重新启动定时任务
  }
  
  private handleAppBackground(): void {
    Logger.info('应用进入后台');
    // 暂停不必要的操作
    // 保存当前状态
    // 释放部分资源
  }
  
  private handleAppDestroy(): void {
    Logger.info('应用即将销毁');
    // 保存重要数据
    // 清理定时器
    // 关闭连接
  }
  
  build() {
    Navigator()
      .mode(NavigationMode.Stack)
      .active(false)
  }
}

// 需要响应应用状态的业务组件
@Component
struct DataSyncComponent {
  @State isSyncing: boolean = false;
  private syncTimer: number | null = null;
  
  aboutToAppear() {
    AppStateManager.getInstance().addListener(this.handleAppStateChange.bind(this));
  }
  
  aboutToDisappear() {
    AppStateManager.getInstance().removeListener(this.handleAppStateChange.bind(this));
    this.stopAutoSync();
  }
  
  private handleAppStateChange(state: AppState): void {
    switch (state) {
      case AppState.FOREGROUND:
        this.startAutoSync();
        break;
      case AppState.BACKGROUND:
        this.stopAutoSync();
        break;
    }
  }
  
  private startAutoSync(): void {
    if (this.syncTimer) return;
    
    // 立即同步一次
    this.performSync();
    
    // 设置定时同步
    this.syncTimer = setInterval(() => {
      this.performSync();
    }, 300000); // 每5分钟同步一次
  }
  
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
  
  private async performSync(): Promise<void> {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    try {
      Logger.debug('开始数据同步');
      // 执行同步逻辑
      await DataService.syncData();
      Logger.debug('数据同步完成');
    } catch (error) {
      Logger.error('数据同步失败', error as Error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  build() {
    // 组件UI
  }
}

## 🚨 最新编译错误及解决方案

### Error: Object literals cannot be used as type declarations
**原因**：函数返回对象字面量而没有定义接口
**解决**：预定义返回类型接口
```typescript
// ❌ 错误示例
private getXunShou(dayGan: string, dayZhi: string) {
  return { 
    shouGan: '甲', 
    shouZhi: '子', 
    xunIndex: 0 
  };
}

// ✅ 正确做法
interface XunShouInfo {
  shouGan: string;
  shouZhi: string;
  xunIndex: number;
}

private getXunShou(dayGan: string, dayZhi: string): XunShouInfo {
  return { 
    shouGan: '甲', 
    shouZhi: '子', 
    xunIndex: 0 
  };
}
```

### Error: Use explicit types instead of "any", "unknown"
**原因**：变量或参数使用了any/unknown类型
**解决**：使用明确的类型注解
```typescript
// ❌ 错误示例
let data: any = {};
let result: unknown;

// ✅ 正确做法
interface DataStructure {
  name: string;
  value: number;
}

let data: DataStructure = { name: '', value: 0 };
let result: string | number | null = null;
```

### Error: The comma operator "," is supported only in "for" loops
**原因**：在非循环语句中使用了逗号操作符
**解决**：使用分号分隔多个语句
```typescript
// ❌ 错误示例
let a = 1, b = 2;  // 在某些上下文中不被允许

// ✅ 正确做法
let a = 1;
let b = 2;
```

### Error: Classes cannot be used as objects
**原因**：将类当作对象字面量使用
**解决**：使用接口或类型定义
```typescript
// ❌ 错误示例
const config = MyClass;  // 将类当作对象使用

// ✅ 正确做法
interface ConfigType {
  setting1: string;
  setting2: number;
}

const config: ConfigType = {
  setting1: 'value1',
  setting2: 123
};
```

### Error: Function may throw exceptions
**原因**：函数可能抛出异常但未处理
**解决**：添加try-catch包装或明确声明
```typescript
// ❌ 错误示例
function riskyOperation() {
  throw new Error('Something went wrong');
}

// ✅ 正确做法
function safeOperation(): string {
  try {
    // 可能出错的操作
    return 'success';
  } catch (error) {
    console.error('Operation failed:', error);
    return 'failed';
  }
}
```

### Error: Deprecated API usage
**原因**：使用了已弃用的API
**解决**：替换为新API或添加兼容性处理
```typescript
// ❌ 错误示例
router.pushUrl('/page');  // 已弃用

// ✅ 正确做法
router.push({ url: '/page' });  // 新API
```

### Error: Missing return type annotation
**原因**：函数缺少返回类型注解
**解决**：为所有函数添加明确返回类型
```typescript
// ❌ 错误示例
function calculate(a: number, b: number) {
  return a + b;
}

// ✅ 正确做法
function calculate(a: number, b: number): number {
  return a + b;
}
```

### Error: Implicit any type in parameter
**原因**：函数参数未指定类型
**解决**：为所有参数添加明确类型
```typescript
// ❌ 错误示例
function processData(data) {  // 参数类型隐式为any
  return data.toString();
}

// ✅ 正确做法
interface ProcessData {
  id: number;
  name: string;
}

function processData(data: ProcessData): string {
  return data.name;
}
```

### Error: Property 'xxx' does not exist on type
**原因**：访问了不存在的属性
**解决**：检查接口定义或使用类型守卫
```typescript
// ❌ 错误示例
interface User {
  name: string;
  age: number;
}

const user: User = { name: 'John', age: 30 };
console.log(user.email);  // email属性不存在

// ✅ 正确做法
interface User {
  name: string;
  age: number;
  email?: string;  // 可选属性
}

const user: User = { name: 'John', age: 30 };
if (user.email) {
  console.log(user.email);
}
```

### Error: Type 'undefined' is not assignable to type
**原因**：将undefined值赋给不允许为空的类型
**解决**：使用联合类型或提供默认值
```typescript
// ❌ 错误示例
interface Config {
  apiUrl: string;
}

const config: Config = {
  apiUrl: undefined  // 错误：undefined不能赋给string
};

// ✅ 正确做法
interface Config {
  apiUrl: string | undefined;  // 或者提供默认值
}

const config: Config = {
  apiUrl: 'https://api.example.com'
};
```

### Error: Cannot find namespace 'xxx'
**原因**：使用了未导入的命名空间
**解决**：正确导入所需模块
```typescript
// ❌ 错误示例
console.log(http.RequestMethod.GET);  // http未导入

// ✅ 正确做法
import http from '@ohos.net.http';

console.log(http.RequestMethod.GET);
```

### Error: JSX element type 'xxx' does not have any construct or call signatures
**原因**：组件定义不符合ArkTS规范
**解决**：确保组件正确装饰和导出
```typescript
// ❌ 错误示例
@Component
struct MyComponent {
  // 缺少必要的装饰器或方法
}

// ✅ 正确做法
@Component
struct MyComponent {
  @State count: number = 0;
  
  build() {
    Text(`Count: ${this.count}`)
  }
}
```

在提交代码前，请确认：

- [ ] 没有使用 `any` 或 `unknown` 类型
- [ ] 没有使用索引签名 `[key: string]: T`
- [ ] 没有使用内联对象字面量类型
- [ ] 对象访问使用明确的属性名，而非动态索引
- [ ] 对象遍历使用传统循环而非 `for...in`
- [ ] 所有对象都有明确的接口定义
- [ ] 静态方法中使用 `ClassName.method()` 而非 `this.method()`
- [ ] 没有使用解构赋值 `const [a, b] = array`
- [ ] 没有使用展开运算符 `...`
- [ ] 没有使用可选链操作符 `?.`
- [ ] 没有使用空值合并操作符 `??`
- [ ] 所有函数都有明确的返回类型注解
- [ ] 复杂类型的变量都有明确的类型注解
- [ ] 没有将类当作对象字面量使用
- [ ] 异步函数都有适当的错误处理
- [ ] 没有使用已弃用的API
- [ ] 所有参数都有明确的类型定义
- [ ] 可选属性都有适当的null/undefined检查
- [ ] 组件装饰器使用正确（@Component, @Entry等）
- [ ] 状态管理使用正确的装饰器（@State, @Prop, @Link等）
- [ ] 导入语句完整且正确
- [ ] 没有未使用的导入
- [ ] 所有异步操作都有await关键字
- [ ] Promise链式调用使用正确的catch处理
- [ ] 数组访问有边界检查
- [ ] 字符串操作有null/undefined检查
- [ ] 组件生命周期方法使用正确
- [ ] 事件处理器有适当的错误处理
- [ ] 网络请求有超时和错误处理
- [ ] 本地存储操作有异常处理
- [ ] UI组件有条件渲染时使用安全的方式
- [ ] 样式属性使用正确的单位和格式
- [ ] 响应式布局考虑不同屏幕尺寸
- [ ] 图片资源使用正确的路径和格式
- [ ] 动画效果有适当的性能优化
- [ ] 内存泄漏风险点已检查（定时器、事件监听器等）
- [ ] 第三方库使用有适当的版本锁定
- [ ] 代码注释清晰且准确
- [ ] 复杂逻辑有适当的单元测试覆盖
- [ ] 性能敏感代码有benchmark测试
- [ ] 安全相关代码经过安全审查
- [ ] 国际化文本有适当的翻译
- [ ] Accessibility功能已考虑
- [ ] 应用权限申请有合理的说明
- [ ] 用户隐私数据处理符合规范
- [ ] 编译警告已处理或有明确理由保留
- [ ] 代码格式符合项目规范
- [ ] 命名约定保持一致
- [ ] 文件组织结构清晰
- [ ] 依赖关系没有循环引用

## 🚨 常见编译错误及解决方案

### Error: Property access is not allowed
**原因**：使用了动态索引访问
**解决**：使用switch语句或Map替代

### Error: Index signature is not allowed
**原因**：定义了索引签名
**解决**：使用Map或Record类型

### Error: Object literal type is not allowed
**原因**：使用了内联对象类型
**解决**：预定义接口

### Error: 'this' cannot be used in static context
**原因**：静态方法中使用了this
**解决**：使用类名.方法名调用

### Error: Destructuring assignment is not allowed
**原因**：使用了解构赋值语法
**解决**：使用传统的逐个赋值方式

### Error: Spread operator is not allowed
**原因**：使用了展开运算符
**解决**：使用显式的数组/对象操作

### Error: Optional chaining is not allowed
**原因**：使用了可选链操作符
**解决**：使用显式的null/undefined检查

### Error: Nullish coalescing is not allowed
**原因**：使用了空值合并操作符
**解决**：使用显式的null/undefined检查和三元运算符

### Error: Return type annotation is required
**原因**：函数缺少返回类型注解
**解决**：为函数添加明确的返回类型

## 🔍 代码审查清单

### 基础规范检查
- [ ] 是否遵循所有ArkTS核心限制
- [ ] 类型定义是否完整且准确
- [ ] 接口设计是否合理且一致
- [ ] 变量命名是否清晰有意义
- [ ] 函数职责是否单一明确

### 安全性检查
- [ ] 输入验证是否充分
- [ ] 错误处理是否完善
- [ ] 敏感数据处理是否安全
- [ ] 权限申请是否必要且合理
- [ ] 网络请求是否有适当的安全措施

### 性能检查
- [ ] 是否有不必要的重复计算
- [ ] 数组和对象操作是否高效
- [ ] 是否合理使用缓存机制
- [ ] 内存泄漏风险点是否已处理
- [ ] UI渲染是否流畅无卡顿

### 可维护性检查
- [ ] 代码结构是否清晰
- [ ] 注释是否准确且必要
- [ ] 复杂逻辑是否有足够文档
- [ ] 组件职责是否分离良好
- [ ] 依赖关系是否合理

### 测试覆盖检查
- [ ] 核心功能是否有单元测试
- [ ] 边界条件是否充分测试
- [ ] 异常情况是否有测试覆盖
- [ ] UI交互是否有自动化测试
- [ ] 性能关键路径是否有基准测试

## 📊 开发效率提升建议

### 1. 开发环境优化
- 使用VS Code配合HarmonyOS插件
- 配置代码片段和快捷键
- 设置实时编译和热重载
- 建立统一的代码模板

### 2. 团队协作规范
- 建立Git提交规范
- 制定分支管理策略
- 定期代码审查机制
- 知识分享和文档维护

### 3. 持续集成建议
- 自动化编译和测试
- 代码质量检查集成
- 性能监控和报警
- 版本发布流程标准化

## 🎯 学习资源推荐

### 官方文档
- [HarmonyOS开发者官网](https://developer.harmonyos.com/)
- [ArkTS语言参考](https://developer.harmonyos.com/docs/docs/doc-references/arkts-intro-0000001280801036)
- [UI开发指南](https://developer.harmonyos.com/docs/docs/doc-guides/ui-development-intro-0000001158361223)

### 社区资源
- HarmonyOS开发者论坛
- GitHub开源项目参考
- 技术博客和教程
- 在线课程和培训

### 实践建议
- 从小功能模块开始练习
- 参考官方示例项目
- 积极参与社区讨论
- 定期总结经验和教训

## 🎯 迁移指南

### 从 TypeScript 到 ArkTS 的常见修改

#### 1. 类型定义修改
```typescript
// TypeScript 原代码
interface UserData {
  [key: string]: any;
  name?: string;
}

// ArkTS 修改后
interface UserData {
  name: string;
  // 移除索引签名，明确所有属性
}
```

#### 2. 循环语句修改
```typescript
// TypeScript 原代码
for (const key in userData) {
  console.log(userData[key]);
}

// ArkTS 修改后
const keys = Object.keys(userData) as (keyof UserData)[];
for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  console.log(userData[key]);
}
```

#### 3. 对象操作修改
```typescript
// TypeScript 原代码
const combined = { ...obj1, ...obj2 };
const [first, second] = array;

// ArkTS 修改后
const combined: CombinedType = {
  prop1: obj1.prop1,
  prop2: obj2.prop2
};
const first = array[0];
const second = array[1];
```

#### 4. 静态方法修改
```typescript
// TypeScript 原代码
class Manager {
  private static data = [];
  
  static process() {
    this.data.push(item);
    return this.data;
  }
}

// ArkTS 修改后
class Manager {
  private static data = [];
  
  static process() {
    Manager.data.push(item);
    return Manager.data;
  }
}
```

## 📖 参考资源

- [HarmonyOS ArkTS 官方文档](https://developer.harmonyos.com/)
- [ArkTS 语言规范](https://developer.harmonyos.com/docs/docs/doc-code/ArkTS-ts-0000001280801036)
- [鸿蒙应用开发最佳实践](https://developer.harmonyos.com/docs/docs/doc-code/ets-guidelines-0000001158361223)

---

*本文档将持续更新，请遵循最新版本进行开发。如有疑问，请参考官方文档或联系开发团队。*