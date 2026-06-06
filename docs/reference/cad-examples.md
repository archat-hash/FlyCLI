# 📐 CAD Modeling Examples for AI Agents

When using the `flycli cad` command, you (the AI Agent) can send Python scripts to FreeCAD via the `render_cadquery` tool. Here are common patterns.

## 1. Simple Box (using Part API)
If CadQuery is not available, use the built-in FreeCAD `Part` module.

```python
import FreeCAD as App
import Part

# Create a new document if none exists
if not App.ActiveDocument:
    App.newDocument("FlyCLI_Model")

doc = App.ActiveDocument

# Create a box: length, width, height
box = Part.makeBox(10.0, 10.0, 10.0)
obj = doc.addObject("Part::Feature", "MyBox")
obj.Shape = box

doc.recompute()
```

## 2. Drawing a Line (Box Line)
Creating a polyline that forms a square (box-like boundary).

```python
import FreeCAD as App
import Part

if not App.ActiveDocument:
    App.newDocument("FlyCLI_Model")

doc = App.ActiveDocument

# Define points
p1 = App.Vector(0, 0, 0)
p2 = App.Vector(10, 0, 0)
p3 = App.Vector(10, 10, 0)
p4 = App.Vector(0, 10, 0)

# Create segments
l1 = Part.LineSegment(p1, p2)
l2 = Part.LineSegment(p2, p3)
l3 = Part.LineSegment(p3, p4)
l4 = Part.LineSegment(p4, p1)

# Create a wire (box outline)
wire = Part.Wire([l1.toShape(), l2.toShape(), l3.toShape(), l4.toShape()])
obj = doc.addObject("Part::Feature", "BoxLine")
obj.Shape = wire

doc.recompute()
```

## 3. Using CadQuery (Preferred if available)
CadQuery is much more concise for complex geometry.

```python
import cadquery as cq

# Create a box 10x10x10 and show it
result = cq.Workplane("XY").box(10, 10, 10)
show_object(result)
```

## Tips:
- Always check if `App.ActiveDocument` exists.
- Call `doc.recompute()` after adding objects.
- Use `process.stderr` for progress feedback and `process.stdout` for JSON results.
