<script>
	import Incrementer from "./Incrementer.svelte"
	let {counter = $bindable()} = $props()
</script>

<p>Counter is {counter.count}</p>
a
<Incrementer bind:count={counter.count}></Incrementer>