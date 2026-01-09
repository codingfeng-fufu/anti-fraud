# 学校数据导入示例

## 📚 数据库集合创建

需要创建以下集合：

1. **schools** - 学校表
2. **colleges** - 院系表
3. **majors** - 专业表
4. **bind_logs** - 绑定日志表（可选）

---

## 🏫 学校数据示例

### 在云开发控制台导入以下数据到 `schools` 集合：

```json
[
  {
    "schoolId": "HUST",
    "schoolName": "华中科技大学",
    "province": "湖北省",
    "city": "武汉市",
    "studentIdPattern": "U\\d{10}",
    "studentIdExample": "U2023010001",
    "logo": "https://example.com/logo.png",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  },
  {
    "schoolId": "WHU",
    "schoolName": "武汉大学",
    "province": "湖北省",
    "city": "武汉市",
    "studentIdPattern": "\\d{10}",
    "studentIdExample": "2023301001",
    "logo": "https://example.com/logo.png",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  },
  {
    "schoolId": "BJUT",
    "schoolName": "北京大学",
    "province": "北京市",
    "city": "北京市",
    "studentIdPattern": "\\d{10}",
    "studentIdExample": "2023100001",
    "logo": "https://example.com/logo.png",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  }
]
```

---

## 🏢 院系数据示例

### 导入到 `colleges` 集合：

```json
[
  {
    "schoolId": "HUST",
    "collegeId": "CS",
    "collegeName": "计算机科学与技术学院",
    "shortName": "计算机学院",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  },
  {
    "schoolId": "HUST",
    "collegeId": "EE",
    "collegeName": "电气与电子工程学院",
    "shortName": "电气学院",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  },
  {
    "schoolId": "HUST",
    "collegeId": "ME",
    "collegeName": "机械科学与工程学院",
    "shortName": "机械学院",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  },
  {
    "schoolId": "WHU",
    "collegeId": "CS",
    "collegeName": "计算机学院",
    "shortName": "计算机学院",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  }
]
```

---

## 📖 专业数据示例

### 导入到 `majors` 集合：

```json
[
  {
    "schoolId": "HUST",
    "collegeId": "CS",
    "majorId": "CS01",
    "majorName": "计算机科学与技术",
    "degree": "本科",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  },
  {
    "schoolId": "HUST",
    "collegeId": "CS",
    "majorId": "CS02",
    "majorName": "软件工程",
    "degree": "本科",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  },
  {
    "schoolId": "HUST",
    "collegeId": "CS",
    "majorId": "CS03",
    "majorName": "网络空间安全",
    "degree": "本科",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  },
  {
    "schoolId": "HUST",
    "collegeId": "CS",
    "majorId": "CS04",
    "majorName": "人工智能",
    "degree": "本科",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  },
  {
    "schoolId": "HUST",
    "collegeId": "EE",
    "majorId": "EE01",
    "majorName": "电气工程及其自动化",
    "degree": "本科",
    "isActive": true,
    "createdAt": {"$date": "2026-01-07T00:00:00.000Z"}
  }
]
```

---

## 🔍 学号格式说明

### 常见学号格式：

| 学校 | 格式 | 正则表达式 | 示例 |
|-----|------|-----------|------|
| 华中科技大学 | U + 10位数字 | `U\\d{10}` | U2023010001 |
| 武汉大学 | 10位数字 | `\\d{10}` | 2023301001 |
| 北京大学 | 10位数字 | `\\d{10}` | 2023100001 |
| 清华大学 | 10位数字 | `\\d{10}` | 2023300001 |

### 学号组成通常包含：

- 入学年份（4位）：如 2023
- 学院代码（2位）：如 01
- 流水号（4位）：如 0001

---

## 🚀 快速导入步骤

### 1. 创建数据库集合

```
云开发控制台 → 数据库 → 创建集合
依次创建：schools、colleges、majors、bind_logs
```

### 2. 导入数据

```
云开发控制台 → 数据库 → 选择集合 → 导入
选择 JSON 格式 → 粘贴数据 → 确定导入
```

### 3. 配置权限

```
schools 集合：所有用户可读
colleges 集合：所有用户可读
majors 集合：所有用户可读
bind_logs 集合：仅创建者可读写
```

权限设置：

```json
{
  "read": true,
  "write": false
}
```

---

## 🎯 批量生成工具

如果学校数据较多，可以使用以下脚本批量生成：

### Node.js 脚本示例

```javascript
// generate-schools.js
const fs = require('fs');

// 学校列表
const schools = [
  { id: 'HUST', name: '华中科技大学', province: '湖北省', pattern: 'U\\d{10}', example: 'U2023010001' },
  { id: 'WHU', name: '武汉大学', province: '湖北省', pattern: '\\d{10}', example: '2023301001' },
  // ... 更多学校
];

const data = schools.map(school => ({
  schoolId: school.id,
  schoolName: school.name,
  province: school.province,
  city: school.city || '',
  studentIdPattern: school.pattern,
  studentIdExample: school.example,
  logo: '',
  isActive: true,
  createdAt: new Date()
}));

fs.writeFileSync('schools.json', JSON.stringify(data, null, 2));
console.log('学校数据生成完成！');
```

---

## 📝 数据维护

### 添加新学校

```
云开发控制台 → 数据库 → schools 集合 → 添加记录
```

### 更新学校信息

```
云开发控制台 → 数据库 → schools 集合 → 编辑记录
```

### 禁用学校

```
将 isActive 字段设置为 false
```

---

## 🔐 权限配置

### schools、colleges、majors 集合权限

```json
{
  "read": true,
  "write": false
}
```

说明：所有用户可读，只有管理员可写

### bind_logs 集合权限

```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

说明：仅用户本人可读写

---

## ⚠️ 注意事项

1. **学号唯一性**
   - 同一个学号只能绑定一次
   - 云函数会自动检查重复

2. **数据隐私**
   - 学生信息需加密存储
   - 不要在前端暴露敏感信息

3. **格式验证**
   - 学号格式必须符合正则表达式
   - 手机号格式必须正确

4. **数据同步**
   - 定期与学校教务系统同步
   - 及时更新院系专业信息

---

## 📊 数据统计

### 统计各学校绑定人数

```javascript
// 在云开发控制台 → 数据库 → 高级操作中执行
db.collection('users').aggregate()
  .match({
    isBound: true
  })
  .group({
    _id: '$schoolId',
    count: $.sum(1)
  })
  .end()
```

### 统计各院系人数

```javascript
db.collection('users').aggregate()
  .match({
    isBound: true
  })
  .group({
    _id: '$collegeId',
    count: $.sum(1)
  })
  .end()
```

---

## 🎓 扩展功能

### 1. 学号验证接口

可以对接学校教务系统验证学号真实性：

```javascript
// 伪代码
async function verifyStudent(studentId, realName) {
  const result = await callSchoolAPI({
    studentId,
    realName
  });
  return result.verified;
}
```

### 2. 批量导入

管理员可以批量导入学生名单：

```
云开发控制台 → 云函数 → 创建 importStudents
```

### 3. 数据导出

导出已绑定学生列表用于统计分析

---

**数据准备完成后，就可以测试学号绑定功能了！** 🎉

